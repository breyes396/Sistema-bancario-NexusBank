import { ReversalRequest } from './reversalRequest.model.js';
import { Transaction } from '../transaction/transaction.model.js';
import { Account } from '../account/account.model.js';
import { revertTransfer } from '../transaction/transaction.controller.js';
import { revertDeposit } from '../deposit/deposit.controller.js';

// El cliente solicita revertir una transferencia o depósito propio: queda
// PENDIENTE hasta que un administrador la apruebe o rechace.
export const createReversalRequest = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        const {
            type,
            operationId,
            reference,
            amount,
            accountNumber,
            sourceAccountNumber,
            destinationAccountNumber,
            operationDate,
            operationDescription,
            reason
        } = req.body || {};

        const normalizedType = String(type || '').trim().toUpperCase();
        if (!['TRANSFERENCIA', 'DEPOSITO'].includes(normalizedType)) {
            return res.status(400).json({ success: false, message: 'Tipo de operación inválido' });
        }

        if (!operationId) {
            return res.status(400).json({ success: false, message: 'operationId es requerido' });
        }

        if (!reason || !String(reason).trim()) {
            return res.status(400).json({ success: false, message: 'Debes escribir un motivo para solicitar la reversión' });
        }

        const originalTransaction = await Transaction.findByPk(operationId);
        if (!originalTransaction) {
            return res.status(404).json({ success: false, message: 'Transacción no encontrada' });
        }

        const ownerAccount = await Account.findByPk(originalTransaction.accountId);
        if (!ownerAccount || ownerAccount.userId !== userId) {
            return res.status(403).json({ success: false, message: 'No tienes permiso sobre esta transacción' });
        }

        const existingPending = await ReversalRequest.findOne({
            where: { operationId, status: 'PENDING' }
        });
        if (existingPending) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe una solicitud pendiente para esta operación',
                data: { requestId: existingPending.id, createdAt: existingPending.createdAt }
            });
        }

        const reversalRequest = await ReversalRequest.create({
            userId,
            type: normalizedType,
            operationId,
            reference: reference || operationId,
            amount: amount != null ? amount : null,
            accountNumber: accountNumber || '',
            sourceAccountNumber: sourceAccountNumber || '',
            destinationAccountNumber: destinationAccountNumber || '',
            operationDate: operationDate || null,
            operationDescription: operationDescription || '',
            reason: String(reason).trim(),
            status: 'PENDING'
        });

        return res.status(201).json({
            success: true,
            message: 'Solicitud de reversión enviada correctamente para revisión.',
            data: reversalRequest
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
};

// El cliente consulta sus propias solicitudes (para mostrar el estado en la app).
export const listMyReversalRequests = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        const requests = await ReversalRequest.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({ success: true, data: requests });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
};

// El administrador ve todas las solicitudes (por defecto solo pendientes).
export const listReversalRequestsForAdmin = async (req, res) => {
    try {
        const status = req.query?.status ? String(req.query.status).trim().toUpperCase() : null;
        const where = status ? { status } : {};

        const requests = await ReversalRequest.findAll({
            where,
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({ success: true, data: requests });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
};

// Ejecuta la reversión real reutilizando la misma lógica de revertTransfer /
// revertDeposit (balances, auditoría, correos) ya probada en los endpoints de
// autoservicio — como actor es Admin, esas funciones ignoran la ventana de tiempo.
const runRevert = (revertFn, req, operationId, reason) => {
    return new Promise((resolve) => {
        const innerReq = {
            user: req.user,
            params: { id: operationId },
            body: { reason },
            ip: req.ip,
            headers: req.headers
        };
        let capturedStatus = 200;
        let capturedBody = null;
        const innerRes = {
            status(code) {
                capturedStatus = code;
                return this;
            },
            json(body) {
                capturedBody = body;
                resolve({ status: capturedStatus, body: capturedBody });
                return this;
            }
        };
        Promise.resolve(revertFn(innerReq, innerRes)).catch((error) => {
            resolve({ status: 500, body: { success: false, message: error.message } });
        });
    });
};

export const approveReversalRequest = async (req, res) => {
    try {
        const adminId = req.user?.id;
        const { id } = req.params;

        const reversalRequest = await ReversalRequest.findByPk(id);
        if (!reversalRequest) {
            return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
        }
        if (reversalRequest.status !== 'PENDING') {
            return res.status(400).json({ success: false, message: 'Esta solicitud ya fue resuelta' });
        }

        const revertFn = reversalRequest.type === 'TRANSFERENCIA' ? revertTransfer : revertDeposit;
        const result = await runRevert(revertFn, req, reversalRequest.operationId, reversalRequest.reason);

        if (result.status >= 200 && result.status < 300 && result.body?.success) {
            reversalRequest.status = 'APPROVED';
            reversalRequest.resolvedBy = adminId;
            reversalRequest.resolvedAt = new Date();
            await reversalRequest.save();

            return res.status(200).json({
                success: true,
                message: 'Solicitud aprobada y reversión ejecutada correctamente',
                data: { reversalRequest, revertResult: result.body?.data }
            });
        }

        return res.status(result.status || 400).json({
            success: false,
            message: result.body?.message || 'No se pudo ejecutar la reversión'
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
};

export const rejectReversalRequest = async (req, res) => {
    try {
        const adminId = req.user?.id;
        const { id } = req.params;
        const comment = req.body?.comment || req.body?.adminComment || null;

        const reversalRequest = await ReversalRequest.findByPk(id);
        if (!reversalRequest) {
            return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
        }
        if (reversalRequest.status !== 'PENDING') {
            return res.status(400).json({ success: false, message: 'Esta solicitud ya fue resuelta' });
        }

        reversalRequest.status = 'REJECTED';
        reversalRequest.resolvedBy = adminId;
        reversalRequest.resolvedAt = new Date();
        reversalRequest.adminComment = comment;
        await reversalRequest.save();

        return res.status(200).json({ success: true, message: 'Solicitud rechazada', data: reversalRequest });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
};
