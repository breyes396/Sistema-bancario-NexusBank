import { Account } from './account.model.js';
import { generateAccountNumber } from '../../helpers/account-generator.js';
import { getExchangeRate } from '../../helpers/fx-service.js';
import sequelize from '../../configs/db.js';
import config from '../../configs/config.js';
import { Op } from 'sequelize';
import { Transaction } from './transaction.model.js';
import { AccountLimitAudit } from './accountLimitAudit.model.js';
import { TransactionAudit } from './transactionAudit.model.js';
import { AccountBlockHistory } from './accountBlockHistory.model.js';
import { User, UserProfile } from '../user/user.model.js';
import { validateAndApplyCoupon, incrementPromotionUsage } from '../catalog/catalog.controller.js';
import Catalog from '../catalog/catalog.model.js';
import { FailedTransaction } from './failedTransaction.model.js';
import { FraudAlert } from './fraudAlert.model.js';
import fraudDetectionService from '../../services/fraud-detection.service.js';
import { applyExposureRulesByRole } from '../user/user.controller.js';
import {
    sendAccountCreatedEmail,
    sendAccountRejectedEmail,
    sendDepositAlertEmail,
    sendTransferSentEmail,
    sendTransferReceivedEmail,
    sendDepositRevertedEmail,
    sendTransferReversalEmail,
    sendSecurityChangeEmail,
    sendAccountFrozenEmail,
    sendAccountUnfrozenEmail
} from '../../services/email.service.js';

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

const createAccountLimitAudit = async ({
    req,
    actorUserId,
    accountId,
    action,
    outcome,
    previousPerTransactionLimit = null,
    newPerTransactionLimit = null,
    previousDailyTransactionLimit = null,
    newDailyTransactionLimit = null,
    previousStatus = null,
    newStatus = null,
    reason = null,
    metadata = null
}) => {
    try {
        await AccountLimitAudit.create({
            actorUserId,
            accountId,
            action,
            outcome,
            previousPerTransactionLimit,
            newPerTransactionLimit,
            previousDailyTransactionLimit,
            newDailyTransactionLimit,
            previousStatus,
            newStatus,
            reason,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] || null,
            metadata
        });
    } catch (auditError) {
        console.error('Error registrando auditoria de limites:', auditError.message);
    }
};

export const listAccounts = async (req, res) => {
    try {
        const currentUserId = req.user?.id;
        const currentUserRole = req.user?.role;
        
        if (!currentUserId) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        let whereClause = {};
        
        if (currentUserRole === 'Client') {
            whereClause.userId = currentUserId;
        } else if (req.query.userId) {
            whereClause.userId = req.query.userId;
        }

        const accounts = await Account.findAll({ 
            where: whereClause,
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

        // Aplicar máscaras si el usuario es Admin o Employee viendo cuentas de otros
        let accountsData = accounts;
        if ((currentUserRole === 'Admin' || currentUserRole === 'Employee') && whereClause.userId !== currentUserId) {
            accountsData = accounts.map(acc => {
                const accJson = acc.toJSON();
                const maskedUser = accJson.User 
                    ? applyExposureRulesByRole(accJson.User, currentUserRole, currentUserId)
                    : null;

                return {
                    ...accJson,
                    User: maskedUser ? {
                        id: maskedUser.id,
                        email: maskedUser.email,
                        profile: {
                            name: maskedUser.UserProfile?.Name || maskedUser.UserProfile?.Username || 'N/A',
                            documentNumber: maskedUser.UserProfile?.DocumentNumber,
                            phoneNumber: maskedUser.UserProfile?.PhoneNumber
                        }
                    } : accJson.User
                };
            });
        } else {
            // Cliente viendo sus propias cuentas, devolver sin máscaras
            accountsData = accounts.map(acc => acc.toJSON());
        }

        return res.status(200).json({ success: true, data: accountsData });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
};

export const createAccount = async (req, res) => {
    try {
        const currentUserId = req.user?.id;
        const currentUserRole = req.user?.role;
        
        if (!currentUserId) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        if (currentUserRole !== 'Admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Solo administradores pueden crear cuentas' 
            });
        }

        const {
            accountType,
            idCliente,
            perTransactionLimit,
            dailyTransactionLimit
        } = req.body;

        if (!idCliente) {
            return res.status(400).json({ 
                success: false, 
                message: 'El campo idCliente es requerido' 
            });
        }

        const targetUserId = idCliente;
        
        const accountNumber = await generateAccountNumber(accountType);

        const accountPayload = {
            accountNumber,
            userId: targetUserId,
            accountType,
            status: true,
            accountBalance: 0
        };

        if (perTransactionLimit !== undefined) {
            accountPayload.perTransactionLimit = perTransactionLimit;
        }
        if (dailyTransactionLimit !== undefined) {
            accountPayload.dailyTransactionLimit = dailyTransactionLimit;
        }
        accountPayload.lastAdminChangeBy = currentUserId;
        accountPayload.lastAdminChangeAt = new Date();
        accountPayload.lastAdminChangeType = 'CREATE';
        accountPayload.lastAdminChangeReason = 'Creacion de cuenta';

        const account = await Account.create(accountPayload);

        const createdAccountOwner = await getUserEmailAndName(targetUserId);
        if (createdAccountOwner) {
            await sendEmailSafe(() => sendAccountCreatedEmail(createdAccountOwner.email, createdAccountOwner.name, {
                accountNumber: account.accountNumber,
                accountType: account.accountType,
                accountBalance: account.accountBalance
            }));
        }

        return res.status(201).json({ 
            success: true, 
            message: 'Cuenta creada exitosamente',
            data: account 
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
};

export const updateAccountLimits = async (req, res) => {
    try {
        const currentUserId = req.user?.id;
        const currentUserRole = req.user?.role;

        if (!currentUserId) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        if (currentUserRole !== 'Admin' && currentUserRole !== 'Employee') {
            return res.status(403).json({ success: false, message: 'Acceso denegado' });
        }

        const { id } = req.params;
        const { perTransactionLimit, dailyTransactionLimit, status, reason } = req.body;

        const account = await Account.findByPk(id);
        if (!account) {
            return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
        }

        const updates = {};

        if (perTransactionLimit !== undefined) {
            if (perTransactionLimit !== null && Number(perTransactionLimit) < 0) {
                return res.status(400).json({ success: false, message: 'Limite por operacion invalido' });
            }
            updates.perTransactionLimit = perTransactionLimit;
        }

        if (dailyTransactionLimit !== undefined) {
            if (dailyTransactionLimit !== null && Number(dailyTransactionLimit) < 0) {
                return res.status(400).json({ success: false, message: 'Limite diario invalido' });
            }
            updates.dailyTransactionLimit = dailyTransactionLimit;
        }

        if (status !== undefined) {
            updates.status = status;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: 'No hay cambios para aplicar' });
        }

        updates.lastAdminChangeBy = currentUserId;
        updates.lastAdminChangeAt = new Date();
        updates.lastAdminChangeType = 'LIMITS_UPDATE';
        updates.lastAdminChangeReason = reason || 'Actualizacion de limites';

        await account.update(updates);

        const accountOwner = await getUserEmailAndName(account.userId);
        if (accountOwner) {
            await sendEmailSafe(() => sendSecurityChangeEmail(accountOwner.email, accountOwner.name, {
                accountNumber: account.accountNumber,
                changeType: 'Actualizacion de limites',
                changes: {
                    perTransactionLimit: updates.perTransactionLimit,
                    dailyTransactionLimit: updates.dailyTransactionLimit,
                    status: updates.status
                },
                reason: updates.lastAdminChangeReason
            }));

            if (updates.status === false) {
                await sendEmailSafe(() => sendAccountRejectedEmail(
                    accountOwner.email,
                    accountOwner.name,
                    updates.lastAdminChangeReason || 'Cuenta desactivada'
                ));
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Cuenta actualizada exitosamente',
            data: account
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
};

export const convertAccountBalance = async (req, res) => {
    try {
        const currentUserId = req.user?.id;

        if (!currentUserId) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        const accountId = (req.query.accountId || '').toString().trim();
        const targetCurrency = (req.query.targetCurrency || '').toString().trim().toUpperCase();

        if (!accountId) {
            return res.status(400).json({ success: false, message: 'Id de cuenta requerido' });
        }

        if (!targetCurrency) {
            const suggestedCurrencies = ['USD', 'EUR', 'GBP', 'MXN', 'ARS'];
            return res.status(400).json({
                success: false,
                message: 'Moneda destino requerida',
                suggestedCurrencies
            });
        }

        if (!/^[A-Z]{3}$/.test(targetCurrency)) {
            return res.status(400).json({ success: false, message: 'Formato de moneda invalido' });
        }

        const account = await Account.findOne({ where: { id: accountId, userId: currentUserId } });
        if (!account) {
            return res.status(404).json({ success: false, message: 'Cuenta no encontrada para el usuario' });
        }

        const balanceNumber = Number(account.accountBalance || 0);
        const { rate, baseCurrency, rateTimestamp } = await getExchangeRate(targetCurrency);
        const convertedBalance = balanceNumber * Number(rate);

        return res.status(200).json({
            success: true,
            data: {
                accountId: account.id,
                baseCurrency,
                targetCurrency,
                exchangeRate: Number(rate),
                originalBalance: balanceNumber.toFixed(2),
                convertedBalance: convertedBalance.toFixed(2),
                rateTimestamp
            }
        });
    } catch (error) {
        const message = error.name === 'AbortError'
            ? 'Tiempo de espera agotado al consultar la API de divisas'
            : 'Error al convertir saldo';

        return res.status(500).json({ success: false, message, error: error.message });
    }
};

export const getAccountLimitsAdmin = async (req, res) => {
    try {
        const actorUserId = req.user?.id;
        const actorRole = req.user?.role;
        const { id: accountId } = req.params;

        if (!actorUserId) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        if (actorRole !== 'Admin') {
            await createAccountLimitAudit({
                req,
                actorUserId,
                accountId,
                action: 'LIMITS_VIEW',
                outcome: 'DENIED',
                reason: 'Rol insuficiente'
            });

            return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol de Admin' });
        }

        const account = await Account.findByPk(accountId);

        if (!account) {
            await createAccountLimitAudit({
                req,
                actorUserId,
                accountId,
                action: 'LIMITS_VIEW',
                outcome: 'NOT_FOUND',
                reason: 'Cuenta no encontrada'
            });

            return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
        }

        await createAccountLimitAudit({
            req,
            actorUserId,
            accountId,
            action: 'LIMITS_VIEW',
            outcome: 'SUCCESS',
            previousPerTransactionLimit: account.perTransactionLimit,
            previousDailyTransactionLimit: account.dailyTransactionLimit,
            previousStatus: account.status
        });

        return res.status(200).json({
            success: true,
            data: {
                accountId: account.id,
                accountNumber: account.accountNumber,
                perTransactionLimit: account.perTransactionLimit,
                dailyTransactionLimit: account.dailyTransactionLimit,
                status: account.status,
                lastAdminChangeBy: account.lastAdminChangeBy,
                lastAdminChangeAt: account.lastAdminChangeAt,
                lastAdminChangeType: account.lastAdminChangeType,
                lastAdminChangeReason: account.lastAdminChangeReason
            }
        });
    } catch (error) {
        const actorUserId = req.user?.id || 'unknown';
        const { id: accountId } = req.params;

        await createAccountLimitAudit({
            req,
            actorUserId,
            accountId,
            action: 'LIMITS_VIEW',
            outcome: 'ERROR',
            reason: error.message
        });

        return res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
};

export const updateAccountLimitsAdmin = async (req, res) => {
    try {
        const actorUserId = req.user?.id;
        const actorRole = req.user?.role;
        const { id: accountId } = req.params;
        const { perTransactionLimit, dailyTransactionLimit, status, reason } = req.body;

        if (!actorUserId) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        if (actorRole !== 'Admin') {
            await createAccountLimitAudit({
                req,
                actorUserId,
                accountId,
                action: 'LIMITS_UPDATE',
                outcome: 'DENIED',
                reason: 'Rol insuficiente'
            });

            return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol de Admin' });
        }

        const account = await Account.findByPk(accountId);

        if (!account) {
            await createAccountLimitAudit({
                req,
                actorUserId,
                accountId,
                action: 'LIMITS_UPDATE',
                outcome: 'NOT_FOUND',
                reason: 'Cuenta no encontrada'
            });

            return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
        }

        const previousPerTransactionLimit = account.perTransactionLimit;
        const previousDailyTransactionLimit = account.dailyTransactionLimit;
        const previousStatus = account.status;

        const updates = {};

        if (perTransactionLimit !== undefined) {
            if (perTransactionLimit !== null && Number(perTransactionLimit) < 0) {
                await createAccountLimitAudit({
                    req,
                    actorUserId,
                    accountId,
                    action: 'LIMITS_UPDATE',
                    outcome: 'DENIED',
                    previousPerTransactionLimit,
                    previousDailyTransactionLimit,
                    previousStatus,
                    reason: 'Limite por operacion invalido'
                });

                return res.status(400).json({ success: false, message: 'Limite por operacion invalido' });
            }
            updates.perTransactionLimit = perTransactionLimit;
        }

        if (dailyTransactionLimit !== undefined) {
            if (dailyTransactionLimit !== null && Number(dailyTransactionLimit) < 0) {
                await createAccountLimitAudit({
                    req,
                    actorUserId,
                    accountId,
                    action: 'LIMITS_UPDATE',
                    outcome: 'DENIED',
                    previousPerTransactionLimit,
                    previousDailyTransactionLimit,
                    previousStatus,
                    reason: 'Limite diario invalido'
                });

                return res.status(400).json({ success: false, message: 'Limite diario invalido' });
            }
            updates.dailyTransactionLimit = dailyTransactionLimit;
        }

        if (status !== undefined) {
            updates.status = status;
        }

        if (Object.keys(updates).length === 0) {
            await createAccountLimitAudit({
                req,
                actorUserId,
                accountId,
                action: 'LIMITS_UPDATE',
                outcome: 'DENIED',
                previousPerTransactionLimit,
                previousDailyTransactionLimit,
                previousStatus,
                reason: 'No hay cambios para aplicar'
            });

            return res.status(400).json({ success: false, message: 'No hay cambios para aplicar' });
        }

        updates.lastAdminChangeBy = actorUserId;
        updates.lastAdminChangeAt = new Date();
        updates.lastAdminChangeType = 'LIMITS_UPDATE';
        updates.lastAdminChangeReason = reason || 'Actualizacion de limites por administrador';

        await account.update(updates);

        const accountOwner = await getUserEmailAndName(account.userId);
        if (accountOwner) {
            await sendEmailSafe(() => sendSecurityChangeEmail(accountOwner.email, accountOwner.name, {
                accountNumber: account.accountNumber,
                changeType: 'Actualizacion de limites por administrador',
                changes: {
                    perTransactionLimit: updates.perTransactionLimit,
                    dailyTransactionLimit: updates.dailyTransactionLimit,
                    status: updates.status
                },
                reason: updates.lastAdminChangeReason
            }));

            if (updates.status === false) {
                await sendEmailSafe(() => sendAccountRejectedEmail(
                    accountOwner.email,
                    accountOwner.name,
                    updates.lastAdminChangeReason || 'Cuenta desactivada por administrador'
                ));
            }
        }

        await createAccountLimitAudit({
            req,
            actorUserId,
            accountId,
            action: 'LIMITS_UPDATE',
            outcome: 'SUCCESS',
            previousPerTransactionLimit,
            newPerTransactionLimit: account.perTransactionLimit,
            previousDailyTransactionLimit,
            newDailyTransactionLimit: account.dailyTransactionLimit,
            previousStatus,
            newStatus: account.status,
            reason: updates.lastAdminChangeReason
        });

        return res.status(200).json({
            success: true,
            message: 'Limites de cuenta actualizados exitosamente',
            data: account
        });
    } catch (error) {
        const actorUserId = req.user?.id || 'unknown';
        const { id: accountId } = req.params;

        await createAccountLimitAudit({
            req,
            actorUserId,
            accountId,
            action: 'LIMITS_UPDATE',
            outcome: 'ERROR',
            reason: error.message
        });

        return res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
};

export const getAdminAccountDetails = async (req, res) => {
    try {
        const { accountId } = req.params;
        const actorUserId = req.user?.id;
        const actorRole = req.user?.role || 'Admin';

        const account = await Account.findByPk(accountId, {
            attributes: [
                'id',
                'userId',
                'accountNumber',
                'accountType',
                'accountBalance',
                'status',
                'perTransactionLimit',
                'dailyTransactionLimit',
                'openedAt',
                'createdAt'
            ]
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta no encontrada'
            });
        }

        const user = await User.findByPk(account.userId, {
            attributes: ['id', 'email', 'status', 'isVerified'],
            include: [
                {
                    model: UserProfile,
                    as: 'UserProfile',
                    attributes: ['Name', 'Username', 'DocumentType', 'DocumentNumber', 'PhoneNumber']
                }
            ]
        });

        // Aplicar máscaras a datos sensibles del usuario
        const maskedUser = user 
            ? applyExposureRulesByRole(user, actorRole, actorUserId)
            : null;

        const recentMovements = await Transaction.findAll({
            where: { accountId: account.id },
            attributes: ['id', 'type', 'amount', 'description', 'balanceAfter', 'status', 'createdAt'],
            order: [['createdAt', 'DESC']],
            limit: 5
        });

        return res.status(200).json({
            success: true,
            data: {
                account,
                availableBalance: Number(account.accountBalance || 0).toFixed(2),
                user: maskedUser ? {
                    id: maskedUser.id,
                    email: maskedUser.email,
                    status: maskedUser.status,
                    isVerified: maskedUser.isVerified,
                    profile: {
                        name: maskedUser.UserProfile?.Name || maskedUser.UserProfile?.Username || 'N/A',
                        username: maskedUser.UserProfile?.Username,
                        documentType: maskedUser.UserProfile?.DocumentType,
                        documentNumber: maskedUser.UserProfile?.DocumentNumber,
                        phoneNumber: maskedUser.UserProfile?.PhoneNumber
                    }
                } : user,
                recentMovements
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

// ====== ENDPOINTS DE SEGURIDAD Y ANTIFRAUDE ======

/**
 * Obtiene el estado de seguridad del usuario
 * Verifica bloqueos activos, intentos fallidos recientes y alertas de fraude
 */
export const getUserSecurityStatus = async (req, res) => {
    try {
        const currentUserId = req.user?.id;

        if (!currentUserId) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        // Verificar si el usuario está bloqueado
        const blockStatus = await fraudDetectionService.isUserBlocked(currentUserId);

        // Obtener intentos fallidos recientes (últimas 24 horas)
        const recentFailures = await FailedTransaction.count({
            where: {
                userId: currentUserId,
                createdAt: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            }
        });

        // Obtener alertas activas
        const activeAlerts = await FraudAlert.count({
            where: {
                userId: currentUserId,
                status: 'ACTIVE'
            }
        });

        return res.status(200).json({
            success: true,
            data: {
                isBlocked: blockStatus.blocked,
                blockedUntil: blockStatus.blockedUntil || null,
                blockReason: blockStatus.reason || null,
                recentFailedAttempts: recentFailures,
                activeAlerts: activeAlerts,
                security: {
                    status: blockStatus.blocked ? 'BLOCKED' : 'ACTIVE',
                    riskLevel: activeAlerts > 0 ? 'HIGH' : (recentFailures >= 2 ? 'MEDIUM' : 'LOW')
                }
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
};

/**
 * Obtiene los intentos fallidos recientes del usuario
 */
export const getFailedAttempts = async (req, res) => {
    try {
        const currentUserId = req.user?.id;

        if (!currentUserId) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        const attempts = await fraudDetectionService.getUserFailedAttempts(currentUserId);

        const summary = {
            totalAttempts: attempts.length,
            blockedAttempts: attempts.filter(a => a.isBlocked).length,
            byType: {
                TRANSFER: attempts.filter(a => a.type === 'TRANSFER').length,
                DEPOSIT: attempts.filter(a => a.type === 'DEPOSIT').length,
                WITHDRAWAL: attempts.filter(a => a.type === 'WITHDRAWAL').length
            },
            byReason: {}
        };

        // Contar por razón
        attempts.forEach(attempt => {
            summary.byReason[attempt.failureReason] = (summary.byReason[attempt.failureReason] || 0) + 1;
        });

        return res.status(200).json({
            success: true,
            data: {
                summary,
                attempts: attempts.map(a => ({
                    id: a.id,
                    type: a.type,
                    amount: a.amount,
                    reason: a.failureReason,
                    isBlocked: a.isBlocked,
                    blockedUntil: a.blockedUntil,
                    ipAddress: a.ipAddress,
                    createdAt: a.createdAt
                }))
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
};

/**
 * Obtiene las alertas de fraude del usuario
 */
export const getFraudAlerts = async (req, res) => {
    try {
        const currentUserId = req.user?.id;

        if (!currentUserId) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        const alerts = await fraudDetectionService.getUserFraudAlerts(currentUserId);

        const summary = {
            totalAlerts: alerts.length,
            activeAlerts: alerts.filter(a => a.status === 'ACTIVE').length,
            bySeverity: {
                CRITICAL: alerts.filter(a => a.severity === 'CRITICAL').length,
                HIGH: alerts.filter(a => a.severity === 'HIGH').length,
                MEDIUM: alerts.filter(a => a.severity === 'MEDIUM').length,
                LOW: alerts.filter(a => a.severity === 'LOW').length
            }
        };

        return res.status(200).json({
            success: true,
            data: {
                summary,
                alerts: alerts.map(a => ({
                    id: a.id,
                    type: a.alertType,
                    severity: a.severity,
                    description: a.description,
                    status: a.status,
                    failedAttempts: a.failedAttempts,
                    createdAt: a.createdAt,
                    reviewedAt: a.reviewedAt
                }))
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
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

        // ====== VALIDACIÓN T46: Verificar si la cuenta está congelada ======
        if (destinationAccount.accountStatus === 'FROZEN' || destinationAccount.accountStatus === 'SUSPENDED' || destinationAccount.accountStatus === 'BLOCKED') {
            return res.status(423).json({
                success: false,
                message: `La cuenta destino está ${destinationAccount.accountStatus.toLowerCase()} y no puede recibir depósitos`,
                status: destinationAccount.accountStatus,
                reason: destinationAccount.frozenReason
            });
        }

        const pendingRequest = await Transaction.findOne({
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

        const requestRecord = await Transaction.create({
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

        const depositRequest = await Transaction.findOne({
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
        const { couponId } = req.body;

        const depositRequest = await Transaction.findOne({
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

        // Validar y aplicar cupón de promoción si se proporcionó
        let appliedPromotion = null;
        let cashbackAmount = 0;

        if (couponId) {
            const couponValidation = await validateAndApplyCoupon(couponId, 'DEPOSITO', requestAmount, dbTransaction);

            if (!couponValidation.valid) {
                await dbTransaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: couponValidation.message
                });
            }

            appliedPromotion = couponValidation.promotion;
            cashbackAmount = couponValidation.benefit.amount;
        }

        const finalBalance = resultingBalance + cashbackAmount;
        destinationAccount.accountBalance = finalBalance.toFixed(2);
        await destinationAccount.save({ transaction: dbTransaction });

        let depositDescription = depositRequest.description || 'Depósito aprobado';
        if (appliedPromotion) {
            depositDescription += ` - Cupón aplicado: ${appliedPromotion.name} (Cashback: Q${cashbackAmount.toFixed(2)})`;
        }
        depositDescription += ` | Aprobada por ${approverUserId}`;

        depositRequest.status = 'COMPLETADA';
        depositRequest.balanceAfter = finalBalance.toFixed(2);
        depositRequest.description = depositDescription;
        if (appliedPromotion) {
            depositRequest.appliedCouponId = couponId;
        }
        await depositRequest.save({ transaction: dbTransaction });

        // Incrementar contador de uso de la promoción si se aplicó
        if (appliedPromotion) {
            await incrementPromotionUsage(couponId, dbTransaction);
        }

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

        if (appliedPromotion) {
            responseData.appliedPromotion = {
                id: appliedPromotion.id,
                name: appliedPromotion.name,
                cashback: cashbackAmount.toFixed(2),
                totalCredited: (requestAmount + cashbackAmount).toFixed(2)
            };
        }

        return res.status(200).json({
            success: true,
            message: appliedPromotion
                ? `Deposito aprobado exitosamente con cupón ${appliedPromotion.name}`
                : 'Deposito aprobado exitosamente',
            data: responseData
        });
    } catch (error) {
        await dbTransaction.rollback();
        return res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
};

export const createTransfer = async (req, res) => {
    const dbTransaction = await sequelize.transaction();

    try {
        const currentUserId = req.user?.id;

        if (!currentUserId) {
            await dbTransaction.rollback();
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        // ====== VALIDACIÓN ANTIFRAUDE: Verificar bloqueo del usuario ======
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
            description,
            couponId
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
            
            // ====== REGISTRO DE INTENTO FALLIDO - MONTO EXCEDIDO ======
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

        // ====== VALIDACIÓN T46: Verificar si las cuentas están congeladas ======
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
            
            // ====== REGISTRO DE INTENTO FALLIDO ======
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
            
            // Detectar patrones sospechosos
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

        // ====== VALIDACIÓN: Límite de Q2,000 acumulativo específico por destino al día ======
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

        // Validar y aplicar cupón de promoción si se proporcionó
        let appliedPromotion = null;
        let benefitAmount = 0;
        let finalTransferAmount = numericAmount;
        let bonusToDestination = 0;

        if (couponId) {
            const operationType = normalizedRecipientType === 'PROPIA' ? 'TRANSFERENCIA_PROPIA' : 'TRANSFERENCIA_TERCERO';
            const couponValidation = await validateAndApplyCoupon(couponId, operationType, numericAmount, dbTransaction);

            if (!couponValidation.valid) {
                await dbTransaction.rollback();
                await notifyTransferRejected(sourceAccount.userId, `Transferencia rechazada: ${couponValidation.message}`);
                return res.status(400).json({
                    success: false,
                    message: couponValidation.message
                });
            }

            appliedPromotion = couponValidation.promotion;
            benefitAmount = couponValidation.benefit.amount;

            // Aplicar descuento si es transferencia a tercero
            if (couponValidation.benefit.type === 'DISCOUNT') {
                // El descuento reduce el monto debitado de la cuenta origen
                finalTransferAmount = numericAmount - benefitAmount;
            }
            // Aplicar cashback/bonus si es transferencia propia
            else if (couponValidation.benefit.type === 'CASHBACK') {
                // El bonus se suma a la cuenta destino
                bonusToDestination = benefitAmount;
            }
        }

        const sourceNewBalance = sourceBalance - finalTransferAmount;
        const destinationNewBalance = destinationBalance + numericAmount + bonusToDestination;

        sourceAccount.accountBalance = sourceNewBalance.toFixed(2);
        destinationAccount.accountBalance = destinationNewBalance.toFixed(2);

        await sourceAccount.save({ transaction: dbTransaction });
        await destinationAccount.save({ transaction: dbTransaction });

        let transferDescription = description || `Transferencia ${normalizedRecipientType.toLowerCase()}`;
        if (appliedPromotion) {
            if (bonusToDestination > 0) {
                transferDescription += ` - Cupón: ${appliedPromotion.name} (Bonus: Q${bonusToDestination.toFixed(2)})`;
            } else if (benefitAmount > 0) {
                transferDescription += ` - Cupón: ${appliedPromotion.name} (Descuento: Q${benefitAmount.toFixed(2)})`;
            }
        }

        const sentTransaction = await Transaction.create({
            accountId: sourceAccount.id,
            type: 'TRANSFERENCIA_ENVIADA',
            amount: finalTransferAmount.toFixed(2),
            description: transferDescription,
            balanceAfter: sourceNewBalance.toFixed(2),
            relatedAccountId: destinationAccount.id,
            status: 'COMPLETADA'
        }, { transaction: dbTransaction });

        const totalReceivedAmount = numericAmount + bonusToDestination;
        await Transaction.create({
            accountId: destinationAccount.id,
            type: 'TRANSFERENCIA_RECIBIDA',
            amount: totalReceivedAmount.toFixed(2),
            description: transferDescription,
            balanceAfter: destinationNewBalance.toFixed(2),
            relatedAccountId: sourceAccount.id,
            status: 'COMPLETADA'
        }, { transaction: dbTransaction });

        // Incrementar contador de uso de la promoción si se aplicó
        if (appliedPromotion) {
            await incrementPromotionUsage(couponId, dbTransaction);
        }

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

        if (appliedPromotion) {
            responseData.appliedPromotion = {
                id: appliedPromotion.id,
                name: appliedPromotion.name,
                benefitType: bonusToDestination > 0 ? 'BONUS' : 'DISCOUNT',
                benefitAmount: benefitAmount.toFixed(2),
                amountDebited: finalTransferAmount.toFixed(2),
                amountReceived: (numericAmount + bonusToDestination).toFixed(2),
                bonusApplied: bonusToDestination.toFixed(2)
            };
        }

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
                amount: numericAmount + bonusToDestination,
                newBalance: destinationAccount.accountBalance
            }));
        }

        return res.status(200).json({
            success: true,
            message: appliedPromotion 
                ? `Transferencia realizada exitosamente con cupón ${appliedPromotion.name}` 
                : 'Transferencia realizada exitosamente',
            data: responseData
        });
    } catch (error) {
        await dbTransaction.rollback();
        
        // ====== REGISTRO DE INTENTO FALLIDO PARA ANTIFRAUDE ======
        await fraudDetectionService.recordFailedTransaction(req, req.user?.id, {
            type: 'TRANSFER',
            amount: req.body.amount,
            reason: error.message,
            metadata: { errorType: error.name }
        });

        return res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
};

/**
 * createTransactionAudit
 * 
 * Función auxiliar para registrar auditoría de transacciones.
 * Utilizada principalmente para reversiones.
 */
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

/**
 * revertDeposit
 * Endpoint: PUT /accounts/deposit-requests/:id/revert
 * Acceso: Solo Admin y Employee
 * 
 * Propósito:
 * Permite revertir un depósito aprobado dentro de una ventana de tiempo de 1 minuto.
 * Después de ese tiempo, la reversión se bloquea automáticamente.
 * 
 * Validaciones:
 * 1. El depósito debe existir y estar en estado COMPLETADA
 * 2. Debe ser de tipo DEPOSITO
 * 3. No debe haber sido revertido previamente
 * 4. Debe estar dentro de la ventana de 1 minuto
 * 5. La cuenta debe tener saldo suficiente para revertir
 * 
 * Lógica:
 * 1. Busca el depósito y valida todos los criterios
 * 2. Si tenía cupón aplicado, revierte el cashback y decrementa uso
 * 3. Resta el monto del saldo de la cuenta
 * 4. Marca la transacción como revertida
 * 5. Registra evento en auditoría con todos los detalles
 */
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

        // ANTES de la transacción: buscar el depósito (consulta inicial)
        let deposit = await Transaction.findOne({
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

        // Validar que esté completado
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

        // Validar que no esté ya revertido
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

        // Calcular tiempo transcurrido
        const now = new Date();
        const transactionTime = new Date(deposit.updatedAt);
        const timeElapsedMs = now - transactionTime;
        const timeElapsedSeconds = Math.floor(timeElapsedMs / 1000);
        const ONE_MINUTE_MS = 60000;

        // Validar ventana de 1 minuto
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

        // Buscar promoción ANTES de la transacción (si aplica)
        let hadCoupon = false;
        let cashbackToRevert = 0;
        const couponId = deposit.appliedCouponId;

        if (couponId) {
            const promotion = await Catalog.findById(couponId);
            if (promotion && promotion.promotionType === 'DEPOSITO_CASHBACK') {
                hadCoupon = true;
                if (promotion.cashbackPercentage) {
                    cashbackToRevert = (getNumericAmount(deposit.amount) * promotion.cashbackPercentage) / 100;
                } else if (promotion.cashbackAmount) {
                    cashbackToRevert = promotion.cashbackAmount;
                }
            }
        }

        // AHORA inicia la transacción Sequelize
        const dbTransaction = await sequelize.transaction();

        try {
            // Buscar el depósito nuevamente con lock para transacción
            deposit = await Transaction.findOne({
                where: { id },
                transaction: dbTransaction,
                lock: dbTransaction.LOCK.UPDATE
            });

            // Buscar la cuenta con lock
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

            // Validar saldo
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

            // Revertir saldo
            const newBalance = currentBalance - totalToRevert;
            account.accountBalance = newBalance.toFixed(2);
            await account.save({ transaction: dbTransaction });

            // Actualizar transacción
            deposit.status = 'REVERTIDA';
            deposit.isReverted = true;
            deposit.revertedAt = now;
            deposit.revertedBy = actorUserId;
            deposit.revertReason = reason || 'Reversión dentro de ventana de 1 minuto';
            deposit.description = `${deposit.description} | REVERTIDA por ${actorUserId}: ${deposit.revertReason}`;
            await deposit.save({ transaction: dbTransaction });

            // Commit ANTES de operaciones en MongoDB
            await dbTransaction.commit();

            // DESPUÉS del commit: operaciones en MongoDB
            if (hadCoupon && couponId) {
                await Catalog.findByIdAndUpdate(
                    couponId,
                    { $inc: { usesCountTotal: -1 } }
                );
            }

            // Registrar auditoría
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
        return res.status(500).json({ 
            success: false, 
            message: 'Error en el servidor', 
            error: error.message 
        });
    }
};

// Reversión de transferencias - dentro de 5 minutos, crea movimiento compensatorio
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

        // ANTES de la transacción: buscar la transferencia (consulta inicial)
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

        // Validar que sea el dueño de la transferencia (quien la envió)
        if (transfer.accountId) {
            const sourceAccount = await Account.findByPk(transfer.accountId);
            if (!sourceAccount || sourceAccount.userId !== actorUserId) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para revertir esta transferencia'
                });
            }
        }

        // Validar que esté completada
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

        // Validar que no esté ya revertida
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

        // Calcular tiempo transcurrido
        const now = new Date();
        const transactionTime = new Date(transfer.updatedAt);
        const timeElapsedMs = now - transactionTime;
        const timeElapsedSeconds = Math.floor(timeElapsedMs / 1000);
        const FIVE_MINUTES_MS = 5 * 60 * 1000; // 5 minutos

        // Validar ventana de 5 minutos
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

        // Inicia la transacción Sequelize
        const dbTransaction = await sequelize.transaction();

        try {
            // Buscar la transferencia nuevamente con lock para transacción
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

            // Buscar las cuentas con lock
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

            // Validar que la cuenta destino tenga saldo para revertir
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

            // Revertir saldos: devolver dinero a origen, quitar de destino
            sourceAccount.accountBalance = (sourceBalance + transferAmount).toFixed(2);
            destinationAccount.accountBalance = (destBalance - transferAmount).toFixed(2);
            
            await sourceAccount.save({ transaction: dbTransaction });
            await destinationAccount.save({ transaction: dbTransaction });

            // Actualizar transacción original
            transfer.status = 'REVERTIDA';
            transfer.isReverted = true;
            transfer.revertedAt = now;
            transfer.revertedBy = actorUserId;
            transfer.revertReason = reason || 'Reversión dentro de ventana de 5 minutos';
            transfer.description = `${transfer.description} | REVERTIDA por ${actorUserId}: ${transfer.revertReason}`;
            await transfer.save({ transaction: dbTransaction });

            // Crear movimiento compensatorio (transacción inversa)
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

            // Registrar en auditoría
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

            // Commit de la transacción
            await dbTransaction.commit();

            // Enviar emails a ambas partes
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

        // Buscar todas las cuentas del cliente
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

        // Extraer IDs de las cuentas
        const accountIds = accounts.map(acc => acc.id);

        // Buscar todas las transacciones de esas cuentas
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

        // Formatear las cuentas con su información
        const accountsData = accounts.map(acc => ({
            accountId: acc.id,
            accountNumber: acc.accountNumber,
            accountType: acc.accountType,
            currentBalance: acc.accountBalance,
            status: acc.status,
            createdAt: acc.createdAt
        }));

        // Formatear las transacciones
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

            // Información adicional opcional
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

        // Calcular totales
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

        // Obtener información de cuentas y usuarios con datos enmascarados
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

        // Crear mapa de cuentas con usuarios enmascarados
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

        // Enriquecer transacciones con información enmascarada
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

        // Obtener información del propietario de la cuenta con datos enmascarados
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

        // Parámetros de la query
        const { type, order = 'DESC', limit = 20 } = req.query;

        const limitNumber = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
        const validOrder = ['ASC', 'DESC'].includes(order?.toUpperCase()) ? order.toUpperCase() : 'DESC';

        // Tipos válidos de transacciones
        const validTypes = ['DEPOSITO', 'RETIRO', 'TRANSFERENCIA_ENVIADA', 'TRANSFERENCIA_RECIBIDA', 'COMPRA'];

        // Validar tipo si se proporciona
        if (type && !validTypes.includes(type.toUpperCase())) {
            return res.status(400).json({
                success: false,
                message: `Tipo de transacción inválido. Válidos: ${validTypes.join(', ')}`
            });
        }

        // Construir la query
        let transactionQuery = {};
        if (type) {
            transactionQuery.type = type.toUpperCase();
        }

        // Obtener todas las transacciones con los filtros aplicados
        const transactions = await Transaction.findAll({
            where: transactionQuery,
            attributes: ['accountId', 'type'],
            raw: true
        });

        // Agrupar por accountId y contar
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

        // Obtener información de las cuentas
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

        // Obtener información de usuarios
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

        // Combinar datos y crear ranking
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

        // Ordenar según parámetro
        ranking.sort((a, b) => {
            if (validOrder === 'DESC') {
                return b.totalMovements - a.totalMovements;
            } else {
                return a.totalMovements - b.totalMovements;
            }
        });

        // Limitar resultados
        const limitedRanking = ranking.slice(0, limitNumber);

        // Calcular estadísticas
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

// ====== ENDPOINTS DE BLOQUEO/DESBLOQUEO DE CUENTAS (T46) ======

/**
 * Congelar una cuenta (Admin only)
 * POST /admin/accounts/:id/freeze
 */
export const freezeAccount = async (req, res) => {
    try {
        const actorUserId = req.user?.id;
        const actorRole = req.user?.role;
        const { id: accountId } = req.params;
        const { reason, reasonDetails, unblockScheduledFor } = req.body || {};

        if (!actorUserId) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        if (actorRole !== 'Admin') {
            return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol de Admin' });
        }

        // Validar razón
        const validReasons = [
            'FRAUD_SUSPICION',
            'SECURITY_REVIEW',
            'COMPLIANCE_CHECK',
            'USER_REQUEST',
            'ADMINISTRATIVE_ACTION',
            'SUSPICIOUS_ACTIVITY',
            'RISK_ASSESSMENT',
            'INVESTIGATION',
            'OTHER'
        ];

        if (!reason || !validReasons.includes(reason)) {
            return res.status(400).json({
                success: false,
                message: 'Razón inválida',
                validReasons
            });
        }

        const account = await Account.findByPk(accountId);

        if (!account) {
            return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
        }

        // Verificar si ya está congelada
        if (account.accountStatus === 'FROZEN') {
            return res.status(400).json({
                success: false,
                message: 'La cuenta ya está congelada',
                currentStatus: account.accountStatus
            });
        }

        // Verificar si está cerrada
        if (account.accountStatus === 'CLOSED') {
            return res.status(400).json({
                success: false,
                message: 'No se puede congelar una cuenta cerrada',
                currentStatus: account.accountStatus
            });
        }

        const previousStatus = account.accountStatus;

        // Actualizar cuenta
        await account.update({
            accountStatus: 'FROZEN',
            status: false,
            frozenReason: reasonDetails || reason,
            frozenAt: new Date(),
            lastAdminChangeBy: actorUserId,
            lastAdminChangeAt: new Date(),
            lastAdminChangeType: 'FREEZE',
            lastAdminChangeReason: reasonDetails || reason
        });

        // Registrar en historial
        const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
        const userAgent = req.headers['user-agent'];

        await AccountBlockHistory.create({
            accountId,
            action: 'FREEZE',
            previousStatus,
            newStatus: 'FROZEN',
            reason,
            reasonDetails: reasonDetails || null,
            performedBy: actorUserId,
            performedByRole: actorRole,
            unblockScheduledFor: unblockScheduledFor || null,
            ipAddress,
            userAgent
        });

        // Notificar al dueño de la cuenta con email específico de congelación
        const accountOwner = await getUserEmailAndName(account.userId);
        if (accountOwner) {
            await sendEmailSafe(() => sendAccountFrozenEmail(
                accountOwner.email,
                accountOwner.name,
                {
                    accountNumber: account.accountNumber,
                    reason,
                    reasonDetails,
                    frozenAt: account.frozenAt,
                    performedByName: 'Equipo de Administración NexusBank'
                }
            ));
        }

        return res.status(200).json({
            success: true,
            message: 'Cuenta congelada exitosamente',
            data: {
                accountId: account.id,
                accountNumber: account.accountNumber,
                previousStatus,
                currentStatus: account.accountStatus,
                frozenAt: account.frozenAt,
                reason,
                reasonDetails: reasonDetails || null,
                performedBy: actorUserId
            }
        });
    } catch (error) {
        console.error('Error congelando cuenta:', error);
        return res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

/**
 * Descongelar/Rehabilitar una cuenta (Admin only)
 * POST /admin/accounts/:id/unfreeze
 */
export const unfreezeAccount = async (req, res) => {
    try {
        const actorUserId = req.user?.id;
        const actorRole = req.user?.role;
        const { id: accountId } = req.params;
        const { reason, reasonDetails } = req.body || {};

        if (!actorUserId) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        if (actorRole !== 'Admin') {
            return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol de Admin' });
        }

        const account = await Account.findByPk(accountId);

        if (!account) {
            return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
        }

        // Verificar si está congelada
        if (account.accountStatus !== 'FROZEN' && account.accountStatus !== 'SUSPENDED') {
            return res.status(400).json({
                success: false,
                message: 'La cuenta no está congelada o suspendida',
                currentStatus: account.accountStatus
            });
        }

        const previousStatus = account.accountStatus;

        // Actualizar cuenta
        await account.update({
            accountStatus: 'ACTIVE',
            status: true,
            frozenReason: null,
            unfrozenAt: new Date(),
            lastAdminChangeBy: actorUserId,
            lastAdminChangeAt: new Date(),
            lastAdminChangeType: 'UNFREEZE',
            lastAdminChangeReason: reasonDetails || reason || 'Cuenta rehabilitada'
        });

        // Registrar en historial
        const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
        const userAgent = req.headers['user-agent'];

        await AccountBlockHistory.create({
            accountId,
            action: 'UNFREEZE',
            previousStatus,
            newStatus: 'ACTIVE',
            reason: reason || 'RESOLVED',
            reasonDetails: reasonDetails || 'Revisión completada - cuenta rehabilitada',
            performedBy: actorUserId,
            performedByRole: actorRole,
            ipAddress,
            userAgent
        });

        // Notificar al dueño de la cuenta con email específico de descongelación
        const accountOwner = await getUserEmailAndName(account.userId);
        if (accountOwner) {
            await sendEmailSafe(() => sendAccountUnfrozenEmail(
                accountOwner.email,
                accountOwner.name,
                {
                    accountNumber: account.accountNumber,
                    previousReason: account.frozenReason,
                    unfrozenAt: account.unfrozenAt,
                    performedByName: 'Equipo de Administración NexusBank'
                }
            ));
        }

        return res.status(200).json({
            success: true,
            message: 'Cuenta descongelada exitosamente',
            data: {
                accountId: account.id,
                accountNumber: account.accountNumber,
                previousStatus,
                currentStatus: account.accountStatus,
                unfrozenAt: account.unfrozenAt,
                reason: reasonDetails || reason || 'Cuenta rehabilitada',
                performedBy: actorUserId
            }
        });
    } catch (error) {
        console.error('Error descongelando cuenta:', error);
        return res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

/**
 * Obtener historial de bloqueos de una cuenta (Admin only)
 * GET /admin/accounts/:id/block-history
 */
export const getAccountBlockHistory = async (req, res) => {
    try {
        const actorUserId = req.user?.id;
        const actorRole = req.user?.role;
        const { id: accountId } = req.params;

        if (!actorUserId) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        if (actorRole !== 'Admin') {
            return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol de Admin' });
        }

        const account = await Account.findByPk(accountId);

        if (!account) {
            return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
        }

        const history = await AccountBlockHistory.findAll({
            where: { accountId },
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: User,
                    as: 'performer',
                    attributes: ['id', 'email'],
                    required: false
                }
            ]
        });

        return res.status(200).json({
            success: true,
            message: 'Historial de bloqueos obtenido exitosamente',
            data: {
                accountId,
                accountNumber: account.accountNumber,
                currentStatus: account.accountStatus,
                history: history.map(h => ({
                    id: h.id,
                    action: h.action,
                    previousStatus: h.previousStatus,
                    newStatus: h.newStatus,
                    reason: h.reason,
                    reasonDetails: h.reasonDetails,
                    performedBy: h.performedBy,
                    performedByEmail: h.performer?.email || null,
                    performedByRole: h.performedByRole,
                    unblockScheduledFor: h.unblockScheduledFor,
                    createdAt: h.createdAt
                }))
            }
        });
    } catch (error) {
        console.error('Error obteniendo historial de bloqueos:', error);
        return res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};
