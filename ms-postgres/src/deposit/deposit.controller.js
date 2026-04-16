import { Account } from '../account/account.model.js';
import sequelize from '../../configs/db.js';
import { Deposit } from './deposit.model.js';
import { TransactionAudit } from '../transaction/transactionAudit.model.js';
import { User, UserProfile } from '../user/user.model.js';
import {
    sendAccountRejectedEmail,
    sendDepositAlertEmail,
    sendDepositRevertedEmail
} from '../../services/email.service.js';
import {
    AUDIT_ACTIONS,
    AUDIT_RESOURCES,
    recordAuditEvent
} from '../../services/audit.service.js';

const getNumericAmount = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : NaN;
};

const getUserEmailAndName = async (userId) => {
    try {
        if (!userId) return null;
        const user = await User.findByPk(userId, { attributes: ['id', 'email'] });
        if (!user?.email) return null;

        const profile = await UserProfile.findOne({
            where: { UserId: userId },
            attributes: ['Name', 'Username']
        });

        return {
            email: user.email,
            name: profile?.Name || profile?.Username || user.email
        };
    } catch (error) {
        console.error('Error al obtener informaci�n del usuario para email:', error.message);
        return null;
    }
};

const sendEmailSafe = async (sendFn) => {
    try {
        await sendFn();
    } catch (error) {
        console.error('Error enviando alerta por email:', error.message);
    }
};

export const getDepositRequests = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const pageNum = Math.max(1, parseInt(page) || 1);
        const pageSize = Math.min(100, Math.max(1, parseInt(limit) || 20));
        const offset = (pageNum - 1) * pageSize;

        const where = {};
        if (status) {
            where.status = status;
        }

        const { count, rows } = await Deposit.findAndCountAll({
            where,
            include: [
                {
                    model: Account,
                    as: 'Account',
                    attributes: ['id', 'accountNumber', 'accountType']
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: pageSize,
            offset
        });

        const totalPages = Math.ceil(count / pageSize);

        return res.status(200).json({
            success: true,
            code: null,
            message: 'Deposit requests retrieved successfully',
            data: {
                depositRequests: rows,
                pagination: {
                    currentPage: pageNum,
                    pageSize,
                    totalItems: count,
                    totalPages,
                    hasNextPage: pageNum < totalPages,
                    hasPrevPage: pageNum > 1
                }
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error retrieving deposit requests:', error);
        return res.status(500).json({
            success: false,
            code: 'INTERNAL_ERROR',
            message: 'Failed to retrieve deposit requests',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

export const getDepositRequestById = async (req, res) => {
    try {
        const { depositId } = req.params;

        const depositRequest = await Deposit.findByPk(depositId, {
            include: [
                {
                    model: Account,
                    as: 'Account',
                    attributes: ['id', 'accountNumber', 'accountType', 'accountBalance']
                }
            ]
        });

        if (!depositRequest) {
            return res.status(404).json({
                success: false,
                code: 'DEPOSIT_NOT_FOUND',
                message: 'Deposit request not found',
                timestamp: new Date().toISOString()
            });
        }

        return res.status(200).json({
            success: true,
            code: null,
            message: 'Deposit request retrieved successfully',
            data: depositRequest,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error retrieving deposit request:', error);
        return res.status(500).json({
            success: false,
            code: 'INTERNAL_ERROR',
            message: 'Failed to retrieve deposit request',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

export const createDepositRequest = async (req, res) => {
    try {
        const currentUserId = req.user?.id;

        if (!currentUserId) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        const { destinationAccountNumber, amount, description } = req.body;

        if (!destinationAccountNumber || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Cuenta destino y monto son requeridos'
            });
        }

        const numericAmount = getNumericAmount(amount);
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Monto invalido'
            });
        }

        const destinationAccount = await Account.findOne({
            where: { accountNumber: destinationAccountNumber }
        });

        if (!destinationAccount) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta destino no encontrada'
            });
        }

        if (!destinationAccount.status) {
            return res.status(400).json({
                success: false,
                message: 'La cuenta destino no esta activa'
            });
        }

        if (destinationAccount.accountStatus === 'FROZEN' || destinationAccount.accountStatus === 'SUSPENDED' || destinationAccount.accountStatus === 'BLOCKED') {
            return res.status(423).json({
                success: false,
                message: `La cuenta destino está ${destinationAccount.accountStatus.toLowerCase()} y no puede recibir depósitos`,
                status: destinationAccount.accountStatus,
                reason: destinationAccount.frozenReason
            });
        }

        const pendingRequest = await Deposit.findOne({
            where: {
                accountId: destinationAccount.id,
                type: 'DEPOSITO',
                status: 'PENDIENTE',
                relatedAccountId: currentUserId
            }
        });

        if (pendingRequest) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe una solicitud pendiente para esta cuenta y cliente'
            });
        }

        const requestRecord = await Deposit.create({
            accountId: destinationAccount.id,
            type: 'DEPOSITO',
            amount: numericAmount.toFixed(2),
            description: description || 'Solicitud de deposito por formulario de cliente',
            balanceAfter: Number(destinationAccount.accountBalance || 0).toFixed(2),
            status: 'PENDIENTE',
            relatedAccountId: currentUserId
        });

        return res.status(201).json({
            success: true,
            message: 'Solicitud de deposito registrada y pendiente de aprobacion',
            data: requestRecord
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
};

export const updateDepositRequestAmount = async (req, res) => {
    try {
        const actorUserId = req.user?.id;

        if (!actorUserId) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        const { id } = req.params;
        const { amount, reason } = req.body;

        const numericAmount = getNumericAmount(amount);
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Monto invalido'
            });
        }

        const depositRequest = await Deposit.findOne({
            where: {
                id,
                type: 'DEPOSITO'
            }
        });

        if (!depositRequest) {
            return res.status(404).json({
                success: false,
                message: 'Solicitud de deposito no encontrada'
            });
        }

        if (depositRequest.status !== 'PENDIENTE') {
            return res.status(400).json({
                success: false,
                message: 'Solo se puede editar el monto de solicitudes en estado PENDIENTE'
            });
        }

        const previousAmount = getNumericAmount(depositRequest.amount);

        depositRequest.amount = numericAmount.toFixed(2);
        depositRequest.description = `${depositRequest.description || 'Solicitud de deposito'} | Monto ajustado de Q${previousAmount.toFixed(2)} a Q${numericAmount.toFixed(2)} por ${actorUserId}${reason ? ` (Motivo: ${reason})` : ''}`;
        await depositRequest.save();

        return res.status(200).json({
            success: true,
            message: 'Monto de la solicitud de deposito actualizado exitosamente',
            data: {
                transactionId: depositRequest.id,
                previousAmount: previousAmount.toFixed(2),
                newAmount: depositRequest.amount,
                status: depositRequest.status,
                updatedBy: actorUserId
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
};

export const approveDepositRequest = async (req, res) => {
    const dbTransaction = await sequelize.transaction();

    try {
        const approverUserId = req.user?.id;

        if (!approverUserId) {
            await dbTransaction.rollback();
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        const { id } = req.params;

        const depositRequest = await Deposit.findOne({
            where: {
                id,
                type: 'DEPOSITO',
                status: 'PENDIENTE'
            },
            transaction: dbTransaction,
            lock: dbTransaction.LOCK.UPDATE
        });

        if (!depositRequest) {
            await dbTransaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'Solicitud de deposito pendiente no encontrada'
            });
        }

        const destinationAccount = await Account.findByPk(depositRequest.accountId, {
            transaction: dbTransaction,
            lock: dbTransaction.LOCK.UPDATE
        });

        if (!destinationAccount) {
            depositRequest.status = 'FALLIDA';
            depositRequest.description = `${depositRequest.description || ''} | Rechazada: cuenta destino no encontrada`;
            await depositRequest.save({ transaction: dbTransaction });
            await dbTransaction.commit();

            return res.status(404).json({
                success: false,
                message: 'Cuenta destino no encontrada. Solicitud rechazada automaticamente'
            });
        }

        if (!destinationAccount.status) {
            depositRequest.status = 'FALLIDA';
            depositRequest.description = `${depositRequest.description || ''} | Rechazada: cuenta destino inactiva`;
            await depositRequest.save({ transaction: dbTransaction });
            await dbTransaction.commit();

            const destinationOwner = await getUserEmailAndName(destinationAccount.userId);
            if (destinationOwner) {
                await sendEmailSafe(() => sendAccountRejectedEmail(
                    destinationOwner.email,
                    destinationOwner.name,
                    'Solicitud de depósito rechazada: cuenta destino inactiva'
                ));
            }

            return res.status(400).json({
                success: false,
                message: 'La cuenta destino esta inactiva. Solicitud rechazada automaticamente'
            });
        }

        const accountBalance = getNumericAmount(destinationAccount.accountBalance);
        const requestAmount = getNumericAmount(depositRequest.amount);

        if (!Number.isFinite(accountBalance) || !Number.isFinite(requestAmount)) {
            depositRequest.status = 'FALLIDA';
            depositRequest.description = `${depositRequest.description || ''} | Rechazada: datos invalidos para aprobar deposito`;
            await depositRequest.save({ transaction: dbTransaction });
            await dbTransaction.commit();

            const destinationOwner = await getUserEmailAndName(destinationAccount.userId);
            if (destinationOwner) {
                await sendEmailSafe(() => sendAccountRejectedEmail(
                    destinationOwner.email,
                    destinationOwner.name,
                    'Solicitud de depósito rechazada: datos inválidos para aprobar el depósito'
                ));
            }

            return res.status(400).json({
                success: false,
                message: 'No fue posible procesar el deposito por datos invalidos. Solicitud rechazada'
            });
        }

        const resultingBalance = accountBalance + requestAmount;
        const finalBalance = resultingBalance;
        destinationAccount.accountBalance = finalBalance.toFixed(2);
        await destinationAccount.save({ transaction: dbTransaction });

        let depositDescription = depositRequest.description || 'Depósito aprobado';
        depositDescription += ` | Aprobada por ${approverUserId}`;

        depositRequest.status = 'COMPLETADA';
        depositRequest.balanceAfter = finalBalance.toFixed(2);
        depositRequest.description = depositDescription;
        await depositRequest.save({ transaction: dbTransaction });

        await dbTransaction.commit();

        const destinationOwner = await getUserEmailAndName(destinationAccount.userId);
        if (destinationOwner) {
            await sendEmailSafe(() => sendDepositAlertEmail(destinationOwner.email, destinationOwner.name, {
                accountNumber: destinationAccount.accountNumber,
                amount: requestAmount,
                newBalance: destinationAccount.accountBalance
            }));
        }

        const responseData = {
            transactionId: depositRequest.id,
            accountId: destinationAccount.id,
            depositAmount: requestAmount.toFixed(2),
            newBalance: destinationAccount.accountBalance
        };

        await recordAuditEvent({
            req,
            actorUserId: approverUserId,
            action: AUDIT_ACTIONS.DEPOSIT_APPROVAL,
            resource: AUDIT_RESOURCES.DEPOSIT,
            result: 'SUCCESS',
            beforeState: {
                status: 'PENDIENTE',
                balance: accountBalance.toFixed(2)
            },
            afterState: {
                status: 'COMPLETADA',
                balance: destinationAccount.accountBalance
            },
            metadata: {
                depositId: depositRequest.id,
                accountId: destinationAccount.id,
                amount: requestAmount.toFixed(2),
                couponId: null,
                cashbackAmount: '0.00'
            }
        });

        return res.status(200).json({
            success: true,
            message: 'Deposito aprobado exitosamente',
            data: responseData
        });
    } catch (error) {
        await dbTransaction.rollback();

        await recordAuditEvent({
            req,
            actorUserId: req.user?.id || null,
            action: AUDIT_ACTIONS.DEPOSIT_APPROVAL,
            resource: AUDIT_RESOURCES.DEPOSIT,
            result: 'ERROR',
            metadata: {
                depositId: req.params?.id,
                error: error.message
            }
        });

        return res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
};

const createTransactionAudit = async ({
    transactionId,
    actorUserId,
    action,
    outcome,
    previousStatus = null,
    newStatus = null,
    revertedAmount = null,
    relatedCouponId = null,
    reason = null,
    timeElapsedSeconds = null,
    ipAddress = null,
    userAgent = null,
    metadata = null
}) => {
    try {
        await TransactionAudit.create({
            transactionId,
            actorUserId,
            action,
            outcome,
            previousStatus,
            newStatus,
            revertedAmount,
            relatedCouponId,
            reason,
            timeElapsedSeconds,
            ipAddress,
            userAgent,
            metadata
        });
    } catch (auditError) {
        console.error('Error registrando auditoría de transacción:', auditError.message);
    }
};

export const revertDeposit = async (req, res) => {
    try {
        const actorUserId = req.user?.id;

        if (!actorUserId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Usuario no autenticado' 
            });
        }

        const { id } = req.params;
        const reason = req.body?.reason || null;

        let deposit = await Deposit.findOne({
            where: {
                id,
                type: 'DEPOSITO'
            }
        });

        if (!deposit) {
            return res.status(404).json({
                success: false,
                message: 'Depósito no encontrado'
            });
        }

        if (deposit.status !== 'COMPLETADA') {
            await createTransactionAudit({
                transactionId: deposit.id,
                actorUserId,
                action: 'REVERT_DENIED',
                outcome: 'DENIED',
                previousStatus: deposit.status,
                reason: `Depósito en estado ${deposit.status}, solo se pueden revertir depósitos completados`,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });

            return res.status(400).json({
                success: false,
                message: 'Solo se pueden revertir depósitos completados'
            });
        }

        if (deposit.isReverted) {
            await createTransactionAudit({
                transactionId: deposit.id,
                actorUserId,
                action: 'REVERT_DENIED',
                outcome: 'DENIED',
                previousStatus: deposit.status,
                reason: 'Depósito ya fue revertido previamente',
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                metadata: {
                    revertedAt: deposit.revertedAt,
                    revertedBy: deposit.revertedBy
                }
            });

            return res.status(400).json({
                success: false,
                message: 'Este depósito ya fue revertido previamente',
                revertedAt: deposit.revertedAt,
                revertedBy: deposit.revertedBy
            });
        }

        const now = new Date();
        const transactionTime = new Date(deposit.updatedAt);
        const timeElapsedMs = now - transactionTime;
        const timeElapsedSeconds = Math.floor(timeElapsedMs / 1000);
        const ONE_MINUTE_MS = 60000;

        if (timeElapsedMs > ONE_MINUTE_MS) {
            await createTransactionAudit({
                transactionId: deposit.id,
                actorUserId,
                action: 'REVERT_DENIED',
                outcome: 'DENIED',
                previousStatus: deposit.status,
                reason: `Ventana de reversión expirada. Han pasado ${timeElapsedSeconds} segundos (límite: 60)`,
                timeElapsedSeconds,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });

            return res.status(400).json({
                success: false,
                message: 'La ventana de reversión ha expirado. Solo se pueden revertir depósitos dentro de 1 minuto de su aprobación',
                timeElapsedSeconds,
                timeLimit: 60
            });
        }

        const hadCoupon = false;
        const cashbackToRevert = 0;
        const couponId = null;

        const dbTransaction = await sequelize.transaction();

        try {

            deposit = await Deposit.findOne({
                where: { id },
                transaction: dbTransaction,
                lock: dbTransaction.LOCK.UPDATE
            });

            const account = await Account.findByPk(deposit.accountId, {
                transaction: dbTransaction,
                lock: dbTransaction.LOCK.UPDATE
            });

            if (!account) {
                await dbTransaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Cuenta no encontrada'
                });
            }

            const depositAmount = getNumericAmount(deposit.amount);
            const currentBalance = getNumericAmount(account.accountBalance);
            const totalToRevert = depositAmount + cashbackToRevert;

            if (currentBalance < totalToRevert) {
                await createTransactionAudit({
                    transactionId: deposit.id,
                    actorUserId,
                    action: 'REVERT_DENIED',
                    outcome: 'ERROR',
                    previousStatus: deposit.status,
                    revertedAmount: totalToRevert,
                    relatedCouponId: couponId,
                    reason: `Saldo insuficiente para revertir. Balance actual: Q${currentBalance.toFixed(2)}, se requiere: Q${totalToRevert.toFixed(2)}`,
                    timeElapsedSeconds,
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent']
                });

                await dbTransaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Saldo insuficiente para revertir el depósito',
                    currentBalance: currentBalance.toFixed(2),
                    amountToRevert: totalToRevert.toFixed(2)
                });
            }

            const newBalance = currentBalance - totalToRevert;
            account.accountBalance = newBalance.toFixed(2);
            await account.save({ transaction: dbTransaction });

            deposit.status = 'REVERTIDA';
            deposit.isReverted = true;
            deposit.revertedAt = now;
            deposit.revertedBy = actorUserId;
            deposit.revertReason = reason || 'Reversión dentro de ventana de 1 minuto';
            deposit.description = `${deposit.description} | REVERTIDA por ${actorUserId}: ${deposit.revertReason}`;
            await deposit.save({ transaction: dbTransaction });

            await dbTransaction.commit();

            await createTransactionAudit({
                transactionId: deposit.id,
                actorUserId,
                action: 'REVERT_SUCCESS',
                outcome: 'SUCCESS',
                previousStatus: 'COMPLETADA',
                newStatus: 'REVERTIDA',
                revertedAmount: totalToRevert,
                relatedCouponId: couponId || null,
                reason: deposit.revertReason,
                timeElapsedSeconds,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                metadata: {
                    hadCoupon,
                    cashbackReverted: cashbackToRevert,
                    previousBalance: currentBalance.toFixed(2),
                    newBalance: newBalance.toFixed(2)
                }
            });

            await recordAuditEvent({
                req,
                actorUserId,
                action: AUDIT_ACTIONS.DEPOSIT_REVERSAL,
                resource: AUDIT_RESOURCES.DEPOSIT,
                result: 'SUCCESS',
                beforeState: {
                    status: 'COMPLETADA',
                    balance: currentBalance.toFixed(2)
                },
                afterState: {
                    status: 'REVERTIDA',
                    balance: newBalance.toFixed(2)
                },
                metadata: {
                    depositId: deposit.id,
                    accountId: account.id,
                    revertedAmount: totalToRevert.toFixed(2),
                    reason: deposit.revertReason,
                    timeElapsedSeconds
                }
            });

            const accountOwner = await getUserEmailAndName(account.userId);
            if (accountOwner) {
                await sendEmailSafe(() => sendDepositRevertedEmail(accountOwner.email, accountOwner.name, {
                    accountNumber: account.accountNumber,
                    amount: totalToRevert,
                    reason: deposit.revertReason,
                    newBalance
                }));
            }

            return res.status(200).json({
                success: true,
                message: 'Depósito revertido exitosamente',
                data: {
                    transactionId: deposit.id,
                    accountId: account.id,
                    amountReverted: totalToRevert.toFixed(2),
                    depositAmount: depositAmount.toFixed(2),
                    cashbackReverted: cashbackToRevert.toFixed(2),
                    newBalance: newBalance.toFixed(2),
                    revertedAt: deposit.revertedAt,
                    revertedBy: actorUserId,
                    timeElapsedSeconds,
                    hadCoupon
                }
            });

        } catch (error) {
            await dbTransaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Error revirtiendo depósito:', error);

        await recordAuditEvent({
            req,
            actorUserId: req.user?.id || null,
            action: AUDIT_ACTIONS.DEPOSIT_REVERSAL,
            resource: AUDIT_RESOURCES.DEPOSIT,
            result: 'ERROR',
            metadata: {
                depositId: req.params?.id,
                error: error.message
            }
        });

        return res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor', 
            error: error.message 
        });
    }
};


