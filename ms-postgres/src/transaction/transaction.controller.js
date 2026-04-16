import { Account } from '../account/account.model.js';
import sequelize from '../../configs/db.js';
import config from '../../configs/config.js';
import { Op } from 'sequelize';
import { Transaction } from './transaction.model.js';
import { TransactionAudit } from './transactionAudit.model.js';
import { User, UserProfile } from '../user/user.model.js';
import fraudDetectionService from '../../services/fraud-detection.service.js';
import { applyExposureRulesByRole } from '../user/services/user-masking.service.js';
import {
    sendAccountRejectedEmail,
    sendTransferSentEmail,
    sendTransferReceivedEmail,
    sendTransferReversalEmail
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
        console.error('Error al obtener información del usuario para email:', error.message);
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

const notifyTransferRejected = async (userId, reason) => {
    if (!userId || !reason) return;

    const accountOwner = await getUserEmailAndName(userId);
    if (!accountOwner) return;

    await sendEmailSafe(() => sendAccountRejectedEmail(
        accountOwner.email,
        accountOwner.name,
        reason
    ));
};

const MAX_TRANSFER_AMOUNT = Number.isFinite(config.transfers?.maxAmount) && config.transfers.maxAmount > 0
    ? config.transfers.maxAmount
    : 2000;

const MAX_DAILY_TRANSFER_BY_SOURCE = Number.isFinite(config.transfers?.maxDailyAmountBySource) && config.transfers.maxDailyAmountBySource > 0
    ? config.transfers.maxDailyAmountBySource
    : 10000;

const MAX_DAILY_TRANSFER_BY_DESTINATION_PAIR = Number.isFinite(config.transfers?.maxDailyAmountByDestination) && config.transfers.maxDailyAmountByDestination > 0
    ? config.transfers.maxDailyAmountByDestination
    : 2000;

const getDayRange = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
};

export const getTransferById = async (req, res) => {
    try {
        const { transferId } = req.params;

        const transfer = await Transaction.findByPk(transferId, {
            include: [
                {
                    model: Account,
                    as: 'SourceAccount',
                    attributes: ['id', 'accountNumber', 'accountType', 'accountBalance']
                },
                {
                    model: Account,
                    as: 'DestinationAccount',
                    attributes: ['id', 'accountNumber', 'accountType', 'accountBalance']
                }
            ]
        });

        if (!transfer) {
            return res.status(404).json({
                success: false,
                code: 'TRANSFER_NOT_FOUND',
                message: 'Transfer not found',
                timestamp: new Date().toISOString()
            });
        }

        return res.status(200).json({
            success: true,
            code: null,
            message: 'Transfer retrieved successfully',
            data: transfer,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error retrieving transfer:', error);
        return res.status(500).json({
            success: false,
            code: 'INTERNAL_ERROR',
            message: 'Failed to retrieve transfer',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

export const transferByAlias = async (req, res) => {
    return res.status(410).json({
        success: false,
        message: 'Transferencia por alias movida al microservicio de Mongo (favoritos)'
    });
};

export const createTransfer = async (req, res) => {
    const dbTransaction = await sequelize.transaction();

    try {
        const currentUserId = req.user?.id;

        if (!currentUserId) {
            await dbTransaction.rollback();
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        const blockStatus = await fraudDetectionService.isUserBlocked(currentUserId);
        if (blockStatus.blocked) {
            await dbTransaction.rollback();
            await notifyTransferRejected(
                currentUserId, 
                `Transferencia bloqueada: Tu cuenta fue temporalmente bloqueada por múltiples intentos fallidos. Intenta de nuevo después de ${blockStatus.blockedUntil.toLocaleTimeString()}`
            );
            return res.status(423).json({ 
                success: false, 
                message: 'Tu cuenta ha sido bloqueada temporalmente por razones de seguridad',
                data: { blockedUntil: blockStatus.blockedUntil }
            });
        }

        const {
            sourceAccountNumber,
            destinationAccountNumber,
            recipientType,
            amount,
            description
        } = req.body;

        if (!sourceAccountNumber || !destinationAccountNumber || !amount || !recipientType) {
            await dbTransaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Cuenta origen, cuenta destino, tipo de destinatario y monto son requeridos'
            });
        }

        const normalizedRecipientType = String(recipientType).trim().toUpperCase();
        if (!['PROPIA', 'TERCERO'].includes(normalizedRecipientType)) {
            await dbTransaction.rollback();
            await notifyTransferRejected(currentUserId, 'Transferencia rechazada: tipo de destinatario inválido');
            return res.status(400).json({
                success: false,
                message: 'Tipo de destinatario invalido. Valores permitidos: PROPIA o TERCERO'
            });
        }

        const numericAmount = getNumericAmount(amount);
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            await dbTransaction.rollback();
            await notifyTransferRejected(currentUserId, 'Transferencia rechazada: monto inválido');
            return res.status(400).json({
                success: false,
                message: 'Monto invalido'
            });
        }

        if (numericAmount > MAX_TRANSFER_AMOUNT) {
            await dbTransaction.rollback();
            
            await fraudDetectionService.recordFailedTransaction(req, currentUserId, {
                type: 'TRANSFER',
                amount: numericAmount,
                reason: 'Monto excede el límite máximo',
                metadata: { 
                    attemptedAmount: numericAmount,
                    maxAllowed: MAX_TRANSFER_AMOUNT
                }
            });
            
            await notifyTransferRejected(
                currentUserId,
                `Transferencia rechazada: el monto excede el límite máximo por transacción de Q${MAX_TRANSFER_AMOUNT}`
            );
            return res.status(400).json({
                success: false,
                message: `Transferencia rechazada: el monto excede el limite maximo por transaccion de Q${MAX_TRANSFER_AMOUNT}`
            });
        }

        if (sourceAccountNumber === destinationAccountNumber) {
            await dbTransaction.rollback();
            await notifyTransferRejected(currentUserId, 'Transferencia rechazada: la cuenta origen y destino no pueden ser la misma');
            return res.status(400).json({
                success: false,
                message: 'La cuenta origen y destino no pueden ser la misma'
            });
        }

        const sourceAccount = await Account.findOne({
            where: {
                accountNumber: sourceAccountNumber,
                userId: currentUserId
            },
            transaction: dbTransaction,
            lock: dbTransaction.LOCK.UPDATE
        });

        if (!sourceAccount) {
            await dbTransaction.rollback();
            await notifyTransferRejected(currentUserId, 'Transferencia rechazada: cuenta origen no encontrada para el cliente autenticado');
            return res.status(404).json({
                success: false,
                message: 'Cuenta origen no encontrada para el cliente autenticado'
            });
        }

        const destinationAccount = await Account.findOne({
            where: { accountNumber: destinationAccountNumber },
            transaction: dbTransaction,
            lock: dbTransaction.LOCK.UPDATE
        });

        if (!destinationAccount) {
            await dbTransaction.rollback();
            await notifyTransferRejected(sourceAccount.userId, 'Transferencia rechazada: cuenta destino no encontrada');
            return res.status(404).json({
                success: false,
                message: 'Cuenta destino no encontrada'
            });
        }

        if (!sourceAccount.status || !destinationAccount.status) {
            await dbTransaction.rollback();
            await notifyTransferRejected(sourceAccount.userId, 'Transferencia rechazada: ambas cuentas deben estar activas para realizar la transferencia');
            return res.status(400).json({
                success: false,
                message: 'Ambas cuentas deben estar activas para realizar la transferencia'
            });
        }

        if (sourceAccount.accountStatus === 'FROZEN' || sourceAccount.accountStatus === 'SUSPENDED' || sourceAccount.accountStatus === 'BLOCKED') {
            await dbTransaction.rollback();
            await notifyTransferRejected(sourceAccount.userId, `Transferencia rechazada: tu cuenta está ${sourceAccount.accountStatus}. ${sourceAccount.frozenReason || 'Por favor contacta con soporte.'}`);
            return res.status(423).json({
                success: false,
                message: `Tu cuenta está ${sourceAccount.accountStatus.toLowerCase()}`,
                reason: sourceAccount.frozenReason,
                status: sourceAccount.accountStatus
            });
        }

        if (destinationAccount.accountStatus === 'FROZEN' || destinationAccount.accountStatus === 'SUSPENDED' || destinationAccount.accountStatus === 'BLOCKED') {
            await dbTransaction.rollback();
            await notifyTransferRejected(sourceAccount.userId, 'Transferencia rechazada: la cuenta destino no está disponible para recibir transferencias');
            return res.status(423).json({
                success: false,
                message: 'La cuenta destino no está disponible para recibir transferencias',
                status: destinationAccount.accountStatus
            });
        }

        const isOwnDestination = destinationAccount.userId === currentUserId;
        if (normalizedRecipientType === 'PROPIA' && !isOwnDestination) {
            await dbTransaction.rollback();
            await notifyTransferRejected(sourceAccount.userId, 'Transferencia rechazada: el tipo de destinatario PROPIA no coincide con la cuenta destino');
            return res.status(400).json({
                success: false,
                message: 'El tipo de destinatario PROPIA no coincide con la cuenta destino'
            });
        }

        if (normalizedRecipientType === 'TERCERO' && isOwnDestination) {
            await dbTransaction.rollback();
            await notifyTransferRejected(sourceAccount.userId, 'Transferencia rechazada: el tipo de destinatario TERCERO no coincide con la cuenta destino');
            return res.status(400).json({
                success: false,
                message: 'El tipo de destinatario TERCERO no coincide con la cuenta destino'
            });
        }

        const sourceBalance = getNumericAmount(sourceAccount.accountBalance);
        if (!Number.isFinite(sourceBalance)) {
            await dbTransaction.rollback();
            await notifyTransferRejected(sourceAccount.userId, 'Transferencia rechazada: saldo de cuenta origen inválido');
            return res.status(400).json({
                success: false,
                message: 'Saldo de cuenta origen invalido'
            });
        }

        if (sourceBalance < numericAmount) {
            await dbTransaction.rollback();
            
            await fraudDetectionService.recordFailedTransaction(req, currentUserId, {
                type: 'TRANSFER',
                accountId: sourceAccount.id,
                amount: numericAmount,
                reason: 'Saldo insuficiente',
                metadata: { 
                    requiredAmount: numericAmount,
                    availableBalance: sourceBalance
                }
            });
            
            await fraudDetectionService.detectFraudPatterns(req, currentUserId, {
                type: 'TRANSFER',
                accountId: sourceAccount.id,
                amount: numericAmount
            });

            await notifyTransferRejected(sourceAccount.userId, 'Transferencia rechazada: saldo insuficiente');
            return res.status(400).json({
                success: false,
                message: 'Saldo insuficiente'
            });
        }

        const destinationBalance = getNumericAmount(destinationAccount.accountBalance);
        if (!Number.isFinite(destinationBalance)) {
            await dbTransaction.rollback();
            await notifyTransferRejected(sourceAccount.userId, 'Transferencia rechazada: saldo de cuenta destino inválido');
            return res.status(400).json({
                success: false,
                message: 'Saldo de cuenta destino invalido'
            });
        }

        const { start, end } = getDayRange();

        const sourceTransferredTodayRaw = await Transaction.sum('amount', {
            where: {
                accountId: sourceAccount.id,
                type: 'TRANSFERENCIA_ENVIADA',
                status: 'COMPLETADA',
                createdAt: {
                    [Op.between]: [start, end]
                }
            },
            transaction: dbTransaction
        });

        const sourceTransferredToday = getNumericAmount(sourceTransferredTodayRaw || 0);

        const sourceToDestinationTodayRaw = await Transaction.sum('amount', {
            where: {
                accountId: sourceAccount.id,
                relatedAccountId: destinationAccount.id,
                type: 'TRANSFERENCIA_ENVIADA',
                status: 'COMPLETADA',
                createdAt: {
                    [Op.between]: [start, end]
                }
            },
            transaction: dbTransaction
        });

        const sourceToDestinationToday = getNumericAmount(sourceToDestinationTodayRaw || 0);
        const sourceToDestinationAfterTransfer = sourceToDestinationToday + numericAmount;

        if (sourceToDestinationAfterTransfer > MAX_DAILY_TRANSFER_BY_DESTINATION_PAIR) {
            await dbTransaction.rollback();

            await fraudDetectionService.recordFailedTransaction(req, currentUserId, {
                type: 'TRANSFER',
                accountId: sourceAccount.id,
                amount: numericAmount,
                reason: 'Límite diario por destino excedido',
                metadata: {
                    destinationAccountId: destinationAccount.id,
                    transferredToDestinationToday: sourceToDestinationToday,
                    requestedAmount: numericAmount,
                    dailyLimit: MAX_DAILY_TRANSFER_BY_DESTINATION_PAIR
                }
            });

            const availableToThisDestination = MAX_DAILY_TRANSFER_BY_DESTINATION_PAIR - sourceToDestinationToday;
            await notifyTransferRejected(
                sourceAccount.userId,
                `Transferencia rechazada: ya has transferido Q${sourceToDestinationToday.toFixed(2)} a esta cuenta hoy. El límite diario a esta cuenta es Q${MAX_DAILY_TRANSFER_BY_DESTINATION_PAIR}`
            );

            return res.status(400).json({
                success: false,
                message: `Transferencia rechazada: límite diario de Q${MAX_DAILY_TRANSFER_BY_DESTINATION_PAIR} a esta cuenta ha sido alcanzado`,
                data: {
                    destinationAccountNumber: destinationAccount.accountNumber,
                    transferredToDestinationToday: sourceToDestinationToday.toFixed(2),
                    dailyLimit: MAX_DAILY_TRANSFER_BY_DESTINATION_PAIR.toFixed(2),
                    remainingAvailable: availableToThisDestination.toFixed(2),
                    requestedAmount: numericAmount.toFixed(2)
                }
            });
        }

        const sourceAfterThisTransfer = sourceTransferredToday + numericAmount;
        if (sourceAfterThisTransfer > MAX_DAILY_TRANSFER_BY_SOURCE) {
            await dbTransaction.rollback();
            await notifyTransferRejected(
                sourceAccount.userId,
                `Transferencia rechazada: la cuenta origen supera el límite diario de Q${MAX_DAILY_TRANSFER_BY_SOURCE}`
            );
            return res.status(400).json({
                success: false,
                message: `Transferencia rechazada: la cuenta origen supera el limite diario de Q${MAX_DAILY_TRANSFER_BY_SOURCE}`,
                data: {
                    transferredToday: sourceTransferredToday.toFixed(2),
                    requestedAmount: numericAmount.toFixed(2),
                    projectedTotal: sourceAfterThisTransfer.toFixed(2)
                }
            });
        }

        let finalTransferAmount = numericAmount;

        const sourceNewBalance = sourceBalance - finalTransferAmount;
        const destinationNewBalance = destinationBalance + numericAmount;

        sourceAccount.accountBalance = sourceNewBalance.toFixed(2);
        destinationAccount.accountBalance = destinationNewBalance.toFixed(2);

        await sourceAccount.save({ transaction: dbTransaction });
        await destinationAccount.save({ transaction: dbTransaction });

        const transferDescription = description || `Transferencia ${normalizedRecipientType.toLowerCase()}`;

        const sentTransaction = await Transaction.create({
            accountId: sourceAccount.id,
            type: 'TRANSFERENCIA_ENVIADA',
            amount: finalTransferAmount.toFixed(2),
            description: transferDescription,
            balanceAfter: sourceNewBalance.toFixed(2),
            relatedAccountId: destinationAccount.id,
            status: 'COMPLETADA'
        }, { transaction: dbTransaction });

        const totalReceivedAmount = numericAmount;
        await Transaction.create({
            accountId: destinationAccount.id,
            type: 'TRANSFERENCIA_RECIBIDA',
            amount: totalReceivedAmount.toFixed(2),
            description: transferDescription,
            balanceAfter: destinationNewBalance.toFixed(2),
            relatedAccountId: sourceAccount.id,
            status: 'COMPLETADA'
        }, { transaction: dbTransaction });

        await dbTransaction.commit();

        const responseData = {
            transactionId: sentTransaction.id,
            sourceAccountId: sourceAccount.id,
            destinationAccountId: destinationAccount.id,
            recipientType: normalizedRecipientType,
            amount: numericAmount.toFixed(2),
            sourceNewBalance: sourceNewBalance.toFixed(2),
            destinationNewBalance: destinationNewBalance.toFixed(2)
        };

        const sourceOwner = await getUserEmailAndName(sourceAccount.userId);
        if (sourceOwner) {
            await sendEmailSafe(() => sendTransferSentEmail(sourceOwner.email, sourceOwner.name, {
                fromAccountNumber: sourceAccount.accountNumber,
                toAccountNumber: destinationAccount.accountNumber,
                amount: finalTransferAmount,
                newBalance: sourceAccount.accountBalance
            }));
        }

        const destinationOwner = await getUserEmailAndName(destinationAccount.userId);
        if (destinationOwner) {
            await sendEmailSafe(() => sendTransferReceivedEmail(destinationOwner.email, destinationOwner.name, {
                fromAccountNumber: sourceAccount.accountNumber,
                toAccountNumber: destinationAccount.accountNumber,
                amount: numericAmount,
                newBalance: destinationAccount.accountBalance
            }));
        }

        return res.status(200).json({
            success: true,
            message: 'Transferencia realizada exitosamente',
            data: responseData
        });
    } catch (error) {
        await dbTransaction.rollback();
        
        await fraudDetectionService.recordFailedTransaction(req, req.user?.id, {
            type: 'TRANSFER',
            amount: req.body.amount,
            reason: error.message,
            metadata: { errorType: error.name }
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

export const revertTransfer = async (req, res) => {
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

        let transfer = await Transaction.findOne({
            where: {
                id,
                type: 'TRANSFERENCIA_ENVIADA'
            }
        });

        if (!transfer) {
            return res.status(404).json({
                success: false,
                message: 'Transferencia no encontrada'
            });
        }

        if (transfer.accountId) {
            const sourceAccount = await Account.findByPk(transfer.accountId);
            if (!sourceAccount || sourceAccount.userId !== actorUserId) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para revertir esta transferencia'
                });
            }
        }

        if (transfer.status !== 'COMPLETADA') {
            await createTransactionAudit({
                transactionId: transfer.id,
                actorUserId,
                action: 'REVERT_DENIED',
                outcome: 'DENIED',
                previousStatus: transfer.status,
                reason: `Transferencia en estado ${transfer.status}, solo se pueden revertir transferencias completadas`,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });

            return res.status(400).json({
                success: false,
                message: 'Solo se pueden revertir transferencias completadas'
            });
        }

        if (transfer.isReverted) {
            await createTransactionAudit({
                transactionId: transfer.id,
                actorUserId,
                action: 'REVERT_DENIED',
                outcome: 'DENIED',
                previousStatus: transfer.status,
                reason: 'Transferencia ya fue revertida previamente',
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                metadata: {
                    revertedAt: transfer.revertedAt,
                    revertedBy: transfer.revertedBy
                }
            });

            return res.status(400).json({
                success: false,
                message: 'Esta transferencia ya fue revertida previamente',
                revertedAt: transfer.revertedAt,
                revertedBy: transfer.revertedBy
            });
        }

        const now = new Date();
        const transactionTime = new Date(transfer.updatedAt);
        const timeElapsedMs = now - transactionTime;
        const timeElapsedSeconds = Math.floor(timeElapsedMs / 1000);
        const FIVE_MINUTES_MS = 5 * 60 * 1000; 

        if (timeElapsedMs > FIVE_MINUTES_MS) {
            await createTransactionAudit({
                transactionId: transfer.id,
                actorUserId,
                action: 'REVERT_DENIED',
                outcome: 'DENIED',
                previousStatus: transfer.status,
                reason: `Ventana de reversión expirada. Han pasado ${timeElapsedSeconds} segundos (límite: 300)`,
                timeElapsedSeconds,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });

            return res.status(400).json({
                success: false,
                message: 'La ventana de reversión ha expirado. Solo se pueden revertir transferencias dentro de 5 minutos',
                timeElapsedSeconds,
                timeLimit: 300
            });
        }

        const dbTransaction = await sequelize.transaction();

        try {

            transfer = await Transaction.findOne({
                where: {
                    id,
                    type: 'TRANSFERENCIA_ENVIADA'
                },
                transaction: dbTransaction,
                lock: dbTransaction.LOCK.UPDATE
            });

            if (!transfer) {
                await dbTransaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Transferencia no encontrada'
                });
            }

            const sourceAccount = await Account.findByPk(transfer.accountId, {
                transaction: dbTransaction,
                lock: dbTransaction.LOCK.UPDATE
            });

            const destinationAccount = await Account.findByPk(transfer.relatedAccountId, {
                transaction: dbTransaction,
                lock: dbTransaction.LOCK.UPDATE
            });

            if (!sourceAccount) {
                await dbTransaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Cuenta origen no encontrada'
                });
            }

            if (!destinationAccount) {
                await dbTransaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Cuenta destino no encontrada'
                });
            }

            const transferAmount = getNumericAmount(transfer.amount);
            const sourceBalance = getNumericAmount(sourceAccount.accountBalance);
            const destBalance = getNumericAmount(destinationAccount.accountBalance);

            if (destBalance < transferAmount) {
                await createTransactionAudit({
                    transactionId: transfer.id,
                    actorUserId,
                    action: 'REVERT_DENIED',
                    outcome: 'ERROR',
                    previousStatus: transfer.status,
                    revertedAmount: transferAmount,
                    reason: `Saldo insuficiente en cuenta destino para revertir. Balance: Q${destBalance.toFixed(2)}, se requiere: Q${transferAmount.toFixed(2)}`,
                    timeElapsedSeconds,
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent']
                });

                await dbTransaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'La cuenta destino no tiene saldo suficiente para revertir la transferencia',
                    currentBalance: destBalance.toFixed(2),
                    amountToRevert: transferAmount.toFixed(2)
                });
            }

            sourceAccount.accountBalance = (sourceBalance + transferAmount).toFixed(2);
            destinationAccount.accountBalance = (destBalance - transferAmount).toFixed(2);
            
            await sourceAccount.save({ transaction: dbTransaction });
            await destinationAccount.save({ transaction: dbTransaction });

            transfer.status = 'REVERTIDA';
            transfer.isReverted = true;
            transfer.revertedAt = now;
            transfer.revertedBy = actorUserId;
            transfer.revertReason = reason || 'Reversión dentro de ventana de 5 minutos';
            transfer.description = `${transfer.description} | REVERTIDA por ${actorUserId}: ${transfer.revertReason}`;
            await transfer.save({ transaction: dbTransaction });

            const compensationTransaction = await Transaction.create(
                {
                    accountId: sourceAccount.id,
                    type: 'TRANSFERENCIA_RECIBIDA',
                    amount: transferAmount.toFixed(2),
                    status: 'COMPLETADA',
                    description: `Movimiento compensatorio por reversión de transferencia ${transfer.id}`,
                    balanceAfter: sourceAccount.accountBalance,
                    relatedAccountId: destinationAccount.id,
                    isReverted: false
                },
                { transaction: dbTransaction }
            );

            await Transaction.create(
                {
                    accountId: destinationAccount.id,
                    type: 'TRANSFERENCIA_ENVIADA',
                    amount: transferAmount.toFixed(2),
                    status: 'COMPLETADA',
                    description: `Movimiento compensatorio de salida por reversión de transferencia ${transfer.id}`,
                    balanceAfter: destinationAccount.accountBalance,
                    relatedAccountId: sourceAccount.id,
                    isReverted: false
                },
                { transaction: dbTransaction }
            );

            await createTransactionAudit({
                transactionId: transfer.id,
                actorUserId,
                action: 'REVERT_SUCCESS',
                outcome: 'SUCCESS',
                previousStatus: 'COMPLETADA',
                newStatus: 'REVERTIDA',
                revertedAmount: transferAmount,
                relatedTransactionId: compensationTransaction.id,
                reason: transfer.revertReason,
                timeElapsedSeconds,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                metadata: {
                    sourceAccountId: sourceAccount.id,
                    destinationAccountId: destinationAccount.id,
                    sourceNewBalance: sourceAccount.accountBalance,
                    destinationNewBalance: destinationAccount.accountBalance,
                    compensationTransactionId: compensationTransaction.id
                }
            });

            await recordAuditEvent({
                req,
                actorUserId,
                action: AUDIT_ACTIONS.TRANSFER_REVERSAL,
                resource: AUDIT_RESOURCES.TRANSFER,
                result: 'SUCCESS',
                beforeState: {
                    status: 'COMPLETADA',
                    sourceBalance: sourceBalance.toFixed(2),
                    destinationBalance: destBalance.toFixed(2)
                },
                afterState: {
                    status: 'REVERTIDA',
                    sourceBalance: sourceAccount.accountBalance,
                    destinationBalance: destinationAccount.accountBalance
                },
                metadata: {
                    transferId: transfer.id,
                    compensationTransactionId: compensationTransaction.id,
                    reason: transfer.revertReason,
                    amountReverted: transferAmount.toFixed(2),
                    timeElapsedSeconds
                }
            });

            await dbTransaction.commit();

            const sourceUser = await getUserEmailAndName(sourceAccount.userId);
            const destUser = await getUserEmailAndName(destinationAccount.userId);

            if (sourceUser) {
                await sendEmailSafe(() => sendTransferReversalEmail(sourceUser.email, sourceUser.name, {
                    accountNumber: sourceAccount.accountNumber,
                    amount: transferAmount,
                    recipient: destinationAccount.accountNumber,
                    reason: transfer.revertReason,
                    newBalance: sourceAccount.accountBalance,
                    type: 'REFUNDED'
                }));
            }

            if (destUser) {
                await sendEmailSafe(() => sendTransferReversalEmail(destUser.email, destUser.name, {
                    accountNumber: destinationAccount.accountNumber,
                    amount: transferAmount,
                    sender: sourceAccount.accountNumber,
                    reason: transfer.revertReason,
                    newBalance: destinationAccount.accountBalance,
                    type: 'REVERSED'
                }));
            }

            return res.status(200).json({
                success: true,
                message: 'Transferencia revertida exitosamente',
                data: {
                    originalTransactionId: transfer.id,
                    compensationTransactionId: compensationTransaction.id,
                    sourceAccountId: sourceAccount.id,
                    destinationAccountId: destinationAccount.id,
                    amountReverted: transferAmount.toFixed(2),
                    sourceNewBalance: sourceAccount.accountBalance,
                    destinationNewBalance: destinationAccount.accountBalance,
                    revertedAt: transfer.revertedAt,
                    revertedBy: actorUserId,
                    timeElapsedSeconds
                }
            });

        } catch (error) {
            await dbTransaction.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Error revirtiendo transferencia:', error);

        await recordAuditEvent({
            req,
            actorUserId: req.user?.id || null,
            action: AUDIT_ACTIONS.TRANSFER_REVERSAL,
            resource: AUDIT_RESOURCES.TRANSFER,
            result: 'ERROR',
            metadata: {
                transferId: req.params?.id,
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

export const getMyAccountHistory = async (req, res) => {
    try {
        const currentUserId = req.user?.id;

        if (!currentUserId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Usuario no autenticado' 
            });
        }

        const accounts = await Account.findAll({
            where: { userId: currentUserId },
            attributes: ['id', 'accountNumber', 'accountBalance', 'accountType', 'status', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });

        if (!accounts || accounts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No se encontraron cuentas para este usuario'
            });
        }

        const accountIds = accounts.map(acc => acc.id);

        const transactions = await Transaction.findAll({
            where: {
                accountId: {
                    [Op.in]: accountIds
                }
            },
            attributes: [
                'id',
                'accountId',
                'type',
                'amount',
                'description',
                'balanceAfter',
                'relatedAccountId',
                'status',
                'isReverted',
                'revertedAt',
                'appliedCouponId',
                'createdAt',
                'updatedAt'
            ],
            order: [['createdAt', 'DESC']]
        });

        const accountsData = accounts.map(acc => ({
            accountId: acc.id,
            accountNumber: acc.accountNumber,
            accountType: acc.accountType,
            currentBalance: acc.accountBalance,
            status: acc.status,
            createdAt: acc.createdAt
        }));

        const transactionsData = transactions.map(trx => {
            const transactionInfo = {
                transactionId: trx.id,
                accountId: trx.accountId,
                type: trx.type,
                amount: trx.amount,
                description: trx.description,
                balanceAfter: trx.balanceAfter,
                status: trx.status,
                date: trx.createdAt,
                updatedAt: trx.updatedAt
            };

            if (trx.relatedAccountId) {
                transactionInfo.relatedAccountId = trx.relatedAccountId;
            }
            if (trx.isReverted) {
                transactionInfo.isReverted = true;
                transactionInfo.revertedAt = trx.revertedAt;
            }
            if (trx.appliedCouponId) {
                transactionInfo.appliedCouponId = trx.appliedCouponId;
            }

            return transactionInfo;
        });

        const totalBalance = accounts.reduce((sum, acc) => {
            return sum + getNumericAmount(acc.accountBalance);
        }, 0);

        return res.status(200).json({
            success: true,
            message: 'Historial de cuenta obtenido exitosamente',
            data: {
                accounts: accountsData,
                totalBalance: totalBalance.toFixed(2),
                transactions: transactionsData,
                summary: {
                    totalAccounts: accounts.length,
                    totalTransactions: transactions.length,
                    activeAccounts: accounts.filter(acc => acc.status).length
                }
            }
        });

    } catch (error) {
        console.error('Error obteniendo historial de cuenta:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor', 
            error: error.message 
        });
    }
};

export const getMyTransactions = async (req, res) => {
    return getMyAccountHistory(req, res);
};

export const getAdminTransactions = async (req, res) => {
    try {
        const actorUserId = req.user?.id;

        if (!actorUserId) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }

        const {
            accountId,
            userId,
            type,
            status,
            startDate,
            endDate,
            page = 1,
            limit = 20
        } = req.query;

        const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
        const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
        const offset = (parsedPage - 1) * parsedLimit;

        const transactionWhere = {};

        if (accountId) {
            transactionWhere.accountId = String(accountId).trim();
        }

        if (type) {
            transactionWhere.type = String(type).trim().toUpperCase();
        }

        if (status) {
            transactionWhere.status = String(status).trim().toUpperCase();
        }

        if (startDate || endDate) {
            const dateWhere = {};

            if (startDate) {
                const parsedStartDate = new Date(startDate);
                if (Number.isNaN(parsedStartDate.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: 'startDate inválida'
                    });
                }
                dateWhere[Op.gte] = parsedStartDate;
            }

            if (endDate) {
                const parsedEndDate = new Date(endDate);
                if (Number.isNaN(parsedEndDate.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: 'endDate inválida'
                    });
                }
                dateWhere[Op.lte] = parsedEndDate;
            }

            transactionWhere.createdAt = dateWhere;
        }

        let targetAccountIds = null;

        if (userId) {
            const accountsByUser = await Account.findAll({
                where: { userId: String(userId).trim() },
                attributes: ['id'],
                raw: true
            });

            targetAccountIds = accountsByUser.map((account) => account.id);

            if (targetAccountIds.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: 'No se encontraron cuentas para el usuario indicado',
                    data: [],
                    pagination: {
                        page: parsedPage,
                        limit: parsedLimit,
                        totalRecords: 0,
                        totalPages: 0
                    }
                });
            }

            if (transactionWhere.accountId && !targetAccountIds.includes(transactionWhere.accountId)) {
                return res.status(200).json({
                    success: true,
                    message: 'La cuenta no pertenece al usuario indicado',
                    data: [],
                    pagination: {
                        page: parsedPage,
                        limit: parsedLimit,
                        totalRecords: 0,
                        totalPages: 0
                    }
                });
            }

            if (!transactionWhere.accountId) {
                transactionWhere.accountId = { [Op.in]: targetAccountIds };
            }
        }

        const { count, rows } = await Transaction.findAndCountAll({
            where: transactionWhere,
            attributes: [
                'id',
                'accountId',
                'type',
                'amount',
                'description',
                'balanceAfter',
                'relatedAccountId',
                'status',
                'isReverted',
                'revertedAt',
                'appliedCouponId',
                'createdAt',
                'updatedAt'
            ],
            order: [['createdAt', 'DESC']],
            offset,
            limit: parsedLimit
        });

        const accountIds = [...new Set(rows.map(t => t.accountId))];
        const accountsWithUsers = await Account.findAll({
            where: { id: { [Op.in]: accountIds } },
            attributes: ['id', 'accountNumber', 'accountType', 'userId'],
            include: [{
                model: User,
                as: 'User',
                attributes: ['id', 'email'],
                include: [{
                    model: UserProfile,
                    as: 'UserProfile',
                    attributes: ['Name', 'Username', 'DocumentNumber', 'PhoneNumber']
                }]
            }]
        });

        const accountMap = {};
        accountsWithUsers.forEach(acc => {
            const maskedUser = acc.User 
                ? applyExposureRulesByRole(acc.User, 'Admin', actorUserId)
                : null;

            accountMap[acc.id] = {
                accountNumber: acc.accountNumber,
                accountType: acc.accountType,
                owner: maskedUser ? {
                    id: maskedUser.id,
                    email: maskedUser.email,
                    name: maskedUser.UserProfile?.Name || maskedUser.UserProfile?.Username || 'N/A',
                    documentNumber: maskedUser.UserProfile?.DocumentNumber,
                    phoneNumber: maskedUser.UserProfile?.PhoneNumber
                } : null
            };
        });

        const enrichedTransactions = rows.map(trx => ({
            ...trx.toJSON(),
            accountInfo: accountMap[trx.accountId] || null
        }));

        return res.status(200).json({
            success: true,
            message: 'Transacciones globales obtenidas exitosamente',
            data: enrichedTransactions,
            pagination: {
                page: parsedPage,
                limit: parsedLimit,
                totalRecords: count,
                totalPages: Math.ceil(count / parsedLimit)
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

export const getEmployeeAccountTransactions = async (req, res) => {
    try {
        const actorUserId = req.user?.id;

        if (!actorUserId) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }

        const { accountId } = req.params;
        const { page = 1, limit = 20, type, status } = req.query;

        if (!accountId) {
            return res.status(400).json({
                success: false,
                message: 'Id de cuenta requerido'
            });
        }

        const account = await Account.findByPk(String(accountId).trim(), {
            attributes: ['id', 'accountNumber', 'accountType', 'status', 'userId']
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta no encontrada'
            });
        }

        const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
        const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
        const offset = (parsedPage - 1) * parsedLimit;

        const where = { accountId: account.id };

        if (type) {
            where.type = String(type).trim().toUpperCase();
        }

        if (status) {
            where.status = String(status).trim().toUpperCase();
        }

        const { count, rows } = await Transaction.findAndCountAll({
            where,
            attributes: [
                'id',
                'accountId',
                'type',
                'amount',
                'description',
                'balanceAfter',
                'relatedAccountId',
                'status',
                'isReverted',
                'revertedAt',
                'createdAt'
            ],
            order: [['createdAt', 'DESC']],
            offset,
            limit: parsedLimit
        });

        const accountOwner = await User.findByPk(account.userId, {
            attributes: ['id', 'email'],
            include: [{
                model: UserProfile,
                as: 'UserProfile',
                attributes: ['Name', 'Username', 'DocumentNumber', 'PhoneNumber']
            }]
        });

        const maskedOwner = accountOwner 
            ? applyExposureRulesByRole(accountOwner, 'Employee', actorUserId)
            : null;

        const accountWithMaskedOwner = {
            id: account.id,
            accountNumber: account.accountNumber,
            accountType: account.accountType,
            status: account.status,
            owner: maskedOwner ? {
                id: maskedOwner.id,
                email: maskedOwner.email || 'N/A',
                name: maskedOwner.UserProfile?.Name || maskedOwner.UserProfile?.Username || 'N/A',
                documentNumber: maskedOwner.UserProfile?.DocumentNumber,
                phoneNumber: maskedOwner.UserProfile?.PhoneNumber
            } : null
        };

        return res.status(200).json({
            success: true,
            message: 'Transacciones de cuenta obtenidas exitosamente',
            data: {
                account: accountWithMaskedOwner,
                transactions: rows
            },
            pagination: {
                page: parsedPage,
                limit: parsedLimit,
                totalRecords: count,
                totalPages: Math.ceil(count / parsedLimit)
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

export const getDashboardTransactionRanking = async (req, res) => {
    try {
        const actorUserId = req.user?.id;
        const actorRole = req.user?.role;

        if (!actorUserId) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }

        if (actorRole !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo admins pueden ver este reporte'
            });
        }

        const { type, order = 'DESC', limit = 20 } = req.query;

        const limitNumber = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
        const validOrder = ['ASC', 'DESC'].includes(order?.toUpperCase()) ? order.toUpperCase() : 'DESC';

        const validTypes = ['DEPOSITO', 'RETIRO', 'TRANSFERENCIA_ENVIADA', 'TRANSFERENCIA_RECIBIDA', 'COMPRA'];

        if (type && !validTypes.includes(type.toUpperCase())) {
            return res.status(400).json({
                success: false,
                message: `Tipo de transacción inválido. Válidos: ${validTypes.join(', ')}`
            });
        }

        let transactionQuery = {};
        if (type) {
            transactionQuery.type = type.toUpperCase();
        }

        const transactions = await Transaction.findAll({
            where: transactionQuery,
            attributes: ['accountId', 'type'],
            raw: true
        });

        const movementsByAccount = {};
        const transactionsByAccount = {};

        transactions.forEach(trx => {
            if (!movementsByAccount[trx.accountId]) {
                movementsByAccount[trx.accountId] = 0;
                transactionsByAccount[trx.accountId] = {};
            }
            movementsByAccount[trx.accountId]++;
            transactionsByAccount[trx.accountId][trx.type] = 
                (transactionsByAccount[trx.accountId][trx.type] || 0) + 1;
        });

        const accountIds = Object.keys(movementsByAccount);
        const accounts = await Account.findAll({
            where: {
                id: {
                    [Op.in]: accountIds
                }
            },
            attributes: ['id', 'accountNumber', 'accountType', 'accountBalance', 'userId', 'status'],
            raw: true
        });

        const userIds = accounts.map(acc => acc.userId);
        const users = await User.findAll({
            where: {
                id: {
                    [Op.in]: userIds
                }
            },
            attributes: ['id', 'email'],
            raw: true
        });

        const userMap = Object.fromEntries(users.map(u => [u.id, u.email]));

        const ranking = accounts.map(account => ({
            accountId: account.id,
            accountNumber: account.accountNumber,
            accountType: account.accountType,
            accountbalance: account.accountBalance,
            accountStatus: account.status ? 'Activa' : 'Inactiva',
            ownerEmail: userMap[account.userId] || 'N/A',
            totalMovements: movementsByAccount[account.id],
            movementsByType: transactionsByAccount[account.id]
        }));

        ranking.sort((a, b) => {
            if (validOrder === 'DESC') {
                return b.totalMovements - a.totalMovements;
            } else {
                return a.totalMovements - b.totalMovements;
            }
        });

        const limitedRanking = ranking.slice(0, limitNumber);

        const stats = {
            totalAccounts: ranking.length,
            totalMovements: ranking.reduce((sum, acc) => sum + acc.totalMovements, 0),
            averageMovementsPerAccount: ranking.length > 0 
                ? (ranking.reduce((sum, acc) => sum + acc.totalMovements, 0) / ranking.length).toFixed(2)
                : 0,
            topAccount: ranking.length > 0 ? {
                accountNumber: ranking[0].accountNumber,
                movements: ranking[0].totalMovements
            } : null,
            bottomAccount: ranking.length > 0 ? {
                accountNumber: ranking[ranking.length - 1].accountNumber,
                movements: ranking[ranking.length - 1].totalMovements
            } : null
        };

        return res.status(200).json({
            success: true,
            message: 'Ranking de cuentas por movimientos obtenido exitosamente',
            filters: {
                type: type ? type.toUpperCase() : 'TODOS',
                order: validOrder,
                limit: limitNumber
            },
            data: {
                stats,
                ranking: limitedRanking
            }
        });

    } catch (error) {
        console.error('Error obteniendo ranking de transacciones:', error);
        return res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

