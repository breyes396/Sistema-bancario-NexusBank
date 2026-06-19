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
import axios from 'axios';
import { sendTransferReceivedEmail } from '../../services/email.service.js';
import notificationService from '../../services/notification.service.js';

const getNumericAmount = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : NaN;
};

const getDestinationAccountBlockedResponse = (account) => {
    const accountStatus = String(account?.accountStatus || '').toUpperCase();

    if (['FROZEN', 'SUSPENDED', 'BLOCKED'].includes(accountStatus)) {
        return {
            status: 423,
            message: `La cuenta destino está ${accountStatus.toLowerCase()} y no puede recibir depósitos`,
            extra: {
                status: accountStatus,
                reason: account.frozenReason || null
            }
        };
    }

    if (accountStatus === 'CLOSED') {
        return {
            status: 400,
            message: 'La cuenta destino está cerrada y no puede recibir depósitos',
            extra: {
                status: accountStatus
            }
        };
    }

    if (!account?.status) {
        return {
            status: 400,
            message: 'La cuenta destino no está habilitada para recibir depósitos',
            extra: {
                status: accountStatus || 'INACTIVE'
            }
        };
    }

    return null;
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

        const { destinationAccountNumber, amount, description, couponCode } = req.body;

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

        const destinationBlockedResponse = getDestinationAccountBlockedResponse(destinationAccount);
        if (destinationBlockedResponse) {
            return res.status(destinationBlockedResponse.status).json({
                success: false,
                message: destinationBlockedResponse.message,
                ...destinationBlockedResponse.extra
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
            relatedAccountId: currentUserId,
            appliedCouponId: couponCode || null
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

        const destinationBlockedResponse = getDestinationAccountBlockedResponse(destinationAccount);
        if (destinationBlockedResponse) {
            depositRequest.status = 'FALLIDA';
            depositRequest.description = `${depositRequest.description || ''} | Rechazada: cuenta destino ${String(destinationBlockedResponse.extra?.status || '').toLowerCase() || 'inactiva'}`;
            await depositRequest.save({ transaction: dbTransaction });
            await dbTransaction.commit();

            const destinationOwner = await getUserEmailAndName(destinationAccount.userId);
            if (destinationOwner) {
                await sendEmailSafe(() => sendAccountRejectedEmail(
                    destinationOwner.email,
                    destinationOwner.name,
                    destinationBlockedResponse.message
                ));
            }

            return res.status(destinationBlockedResponse.status).json({
                success: false,
                message: `${destinationBlockedResponse.message}. Solicitud rechazada automaticamente`,
                status: destinationBlockedResponse.extra?.status || null,
                reason: destinationBlockedResponse.extra?.reason || null
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

        let cashbackAmount = 0;
        let couponApplied = false;
        let couponInfo = null;

        if (depositRequest.appliedCouponId) {
            try {
                // Call ms-mongo to validate and apply the coupon
                const mongoApiUrl = process.env.MONGO_API_URL || 'http://localhost:3006/api/v1';
                
                const response = await axios.post(`${mongoApiUrl}/catalog/internal/validate-coupon`, {
                    couponId: depositRequest.appliedCouponId,
                    operationType: 'PRIMER_DEPOSITO',
                    amount: requestAmount
                });

                if (response.data && response.data.valid) {
                    couponApplied = true;
                    couponInfo = response.data.benefit;
                    if (couponInfo && couponInfo.type === 'CASHBACK') {
                        cashbackAmount = couponInfo.amount;
                    }
                }
            } catch (err) {
                console.error('Error validating coupon with ms-mongo:', err.message);
                // Si falla la validación del cupón, igual pasamos el depósito sin cashback, pero lo ideal
                // sería informarlo. Por ahora, si falla Mongo, no aplicamos cashback.
            }
        }

        const resultingBalance = accountBalance + requestAmount + cashbackAmount;
        const finalBalance = resultingBalance;
        destinationAccount.accountBalance = finalBalance.toFixed(2);
        await destinationAccount.save({ transaction: dbTransaction });

        let depositDescription = depositRequest.description || 'Depósito aprobado';
        depositDescription += ` | Aprobada por ${approverUserId}`;

        depositRequest.status = 'COMPLETADA';
        depositRequest.balanceAfter = (accountBalance + requestAmount).toFixed(2);
        depositRequest.description = depositDescription;
        await depositRequest.save({ transaction: dbTransaction });

        if (couponApplied && cashbackAmount > 0) {
            await Deposit.create({
                accountId: destinationAccount.id,
                type: 'DEPOSITO',
                amount: cashbackAmount.toFixed(2),
                description: 'Bono cashback por depósito realizado',
                balanceAfter: finalBalance.toFixed(2),
                status: 'COMPLETADA',
                appliedCouponId: depositRequest.appliedCouponId
            }, { transaction: dbTransaction });
        }

        await dbTransaction.commit();

        // Alerta de depósito excesivo
        const depositAmount = Number(depositRequest.amount);
        if (depositAmount > 10000) {
          await notificationService.sendFraudAlert(destinationAccount.userId, {
            title: 'Depósito Excesivo Detectado',
            message: `Se ha acreditado un depósito de Q${depositAmount.toFixed(2)} en tu cuenta ${destinationAccount.accountNumber}.`,
            emailType: 'FRAUD',
            emailData: {
              alertType: 'EXCESSIVE_DEPOSIT',
              severity: 'HIGH',
              description: `Se detectó un depósito por un monto elevado (Q${depositAmount.toFixed(2)}).`,
              detectedAt: new Date()
            }
          });
        }

        const accountOwner = await getUserEmailAndName(destinationAccount.userId);
        if (accountOwner) {
            await sendEmailSafe(() => sendDepositAlertEmail(accountOwner.email, accountOwner.name, {
                accountNumber: destinationAccount.accountNumber,
                amount: requestAmount,
                newBalance: destinationAccount.accountBalance
            }));
        }

        const responseData = {
            transactionId: depositRequest.id,
            accountId: destinationAccount.id,
            depositAmount: requestAmount.toFixed(2),
            cashbackAmount: cashbackAmount > 0 ? cashbackAmount.toFixed(2) : undefined,
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
                couponId: couponApplied ? depositRequest.appliedCouponId : null,
                cashbackAmount: cashbackAmount.toFixed(2)
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
        const actorRole = req.user?.role;

        if (!actorUserId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Usuario no autenticado' 
            });
        }

        const { id } = req.params;
        const reason = req.body?.reason || null;
        const isAdmin = actorRole === 'Admin';

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

        const allowedStatuses = isAdmin ? ['COMPLETADA', 'PENDIENTE'] : ['COMPLETADA'];
        if (!allowedStatuses.includes(deposit.status)) {
            await createTransactionAudit({
                transactionId: deposit.id,
                actorUserId,
                action: 'REVERT_DENIED',
                outcome: 'DENIED',
                previousStatus: deposit.status,
                reason: `Depósito en estado ${deposit.status}, solo se pueden revertir depósitos completados${isAdmin ? ' o pendientes' : ''}`,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });

            return res.status(400).json({
                success: false,
                message: `Solo se pueden revertir depósitos completados${isAdmin ? ' o pendientes' : ''}`
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

        if (timeElapsedMs > ONE_MINUTE_MS && !isAdmin) {
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
            const isCompleted = deposit.status === 'COMPLETADA';
            const totalToRevert = isCompleted ? (depositAmount + cashbackToRevert) : 0;

            if (isCompleted && currentBalance < totalToRevert) {
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

            let newBalance = currentBalance;
            if (isCompleted) {
                newBalance = currentBalance - totalToRevert;
                account.accountBalance = newBalance.toFixed(2);
                await account.save({ transaction: dbTransaction });
            }

            const previousStatus = deposit.status;
            deposit.status = 'REVERTIDA';
            deposit.isReverted = true;
            deposit.revertedAt = now;
            deposit.revertedBy = actorUserId;
            deposit.revertReason = reason || `Reversión desde estado ${previousStatus}`;
            deposit.description = `${deposit.description} | REVERTIDA por ${actorUserId}: ${deposit.revertReason}`;
            await deposit.save({ transaction: dbTransaction });

            await dbTransaction.commit();

            await createTransactionAudit({
                transactionId: deposit.id,
                actorUserId,
                action: 'REVERT_SUCCESS',
                outcome: 'SUCCESS',
                previousStatus,
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
                    newBalance: newBalance.toFixed(2),
                    wasPending: previousStatus === 'PENDIENTE'
                }
            });

            await recordAuditEvent({
                req,
                actorUserId,
                action: AUDIT_ACTIONS.DEPOSIT_REVERSAL,
                resource: AUDIT_RESOURCES.DEPOSIT,
                result: 'SUCCESS',
                beforeState: {
                    status: previousStatus,
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
                    timeElapsedSeconds,
                    wasPending: previousStatus === 'PENDIENTE'
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

// Nueva función para que empleados creen depósitos sin afectar cliente
export const createDepositRequestByEmployee = async (req, res) => {
    try {
        const currentUserId = req.user?.id;
        const userRole = req.user?.role;

        if (!currentUserId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Usuario no autenticado' 
            });
        }

        if (!['Employee', 'Admin'].includes(userRole)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Solo empleados y administradores pueden usar este endpoint' 
            });
        }

        const { accountNumber, amount, description } = req.body;

        if (!accountNumber || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Número de cuenta y monto son requeridos'
            });
        }

        const numericAmount = getNumericAmount(amount);
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Monto inválido'
            });
        }

        const targetAccount = await Account.findOne({
            where: { accountNumber }
        });

        if (!targetAccount) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta destino no encontrada'
            });
        }

        if (!targetAccount.status) {
            return res.status(400).json({
                success: false,
                message: 'La cuenta destino no está activa'
            });
        }

        if (['FROZEN', 'SUSPENDED', 'BLOCKED'].includes(targetAccount.accountStatus)) {
            return res.status(423).json({
                success: false,
                message: `La cuenta está ${targetAccount.accountStatus.toLowerCase()} y no puede recibir depósitos`,
                status: targetAccount.accountStatus
            });
        }

        // Los depósitos de empleados van directamente a COMPLETADA sin necesidad de aprobación
        const dbTransaction = await sequelize.transaction();

        try {
            const depositRecord = await Deposit.create({
                accountId: targetAccount.id,
                type: 'DEPOSITO',
                amount: numericAmount.toFixed(2),
                description: description || 'Depósito creado por empleado',
                balanceAfter: (Number(targetAccount.accountBalance || 0) + numericAmount).toFixed(2),
                status: 'COMPLETADA', // Directamente completado
                relatedAccountId: currentUserId,
                createdBy: currentUserId,
                approvedBy: currentUserId,
                approvedAt: new Date()
            }, { transaction: dbTransaction });

            // Actualizar balance de la cuenta
            const newBalance = Number(targetAccount.accountBalance || 0) + numericAmount;
            targetAccount.accountBalance = newBalance.toFixed(2);
            await targetAccount.save({ transaction: dbTransaction });

            // Crear audit de la transacción
            await createTransactionAudit({
                transactionId: depositRecord.id,
                actorUserId: currentUserId,
                action: 'DEPOSIT_CREATED_BY_EMPLOYEE',
                outcome: 'SUCCESS',
                previousStatus: null,
                newStatus: 'COMPLETADA',
                amount: numericAmount,
                relatedCouponId: null,
                reason: `Depósito creado por empleado en cuenta ${accountNumber}`,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                metadata: {
                    previousBalance: targetAccount.accountBalance,
                    newBalance: newBalance.toFixed(2),
                    employeeId: currentUserId,
                    employeeRole: userRole
                }
            });

            await dbTransaction.commit();

            // Registrar en auditoría del sistema
            await recordAuditEvent({
                req,
                actorUserId: currentUserId,
                action: AUDIT_ACTIONS.DEPOSIT_CREATION,
                resource: AUDIT_RESOURCES.DEPOSIT,
                result: 'SUCCESS',
                beforeState: {
                    balance: targetAccount.accountBalance
                },
                afterState: {
                    balance: newBalance.toFixed(2)
                },
                metadata: {
                    depositId: depositRecord.id,
                    accountId: targetAccount.id,
                    accountNumber,
                    amount: numericAmount.toFixed(2),
                    createdBy: userRole
                }
            });

            // Enviar email al dueño de la cuenta (opcional)
            const accountOwner = await getUserEmailAndName(targetAccount.userId);
            if (accountOwner) {
                await sendEmailSafe(() => sendDepositAlertEmail(accountOwner.email, accountOwner.name, {
                    amount: numericAmount,
                    accountNumber: accountNumber,
                    newBalance: newBalance.toFixed(2),
                    createdBy: userRole
                }));
            }

            return res.status(201).json({
                success: true,
                message: 'Depósito creado exitosamente por empleado',
                data: {
                    transactionId: depositRecord.id,
                    accountNumber,
                    amount: numericAmount.toFixed(2),
                    newBalance: newBalance.toFixed(2),
                    status: 'COMPLETADA',
                    createdAt: depositRecord.createdAt,
                    createdBy: currentUserId
                }
            });

        } catch (error) {
            await dbTransaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Error creando depósito por empleado:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor', 
            error: error.message 
        });
    }
};



