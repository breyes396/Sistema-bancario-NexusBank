import { Account } from './account.model.js';
import { generateAccountNumber } from '../../helpers/account-generator.js';
import { getExchangeRate } from '../../helpers/fx-service.js';
import sequelize from '../../configs/db.js';
import config from '../../configs/config.js';
import { Op } from 'sequelize';
import { Transaction } from './transaction.model.js';
import { AccountLimitAudit } from './accountLimitAudit.model.js';
import { TransactionAudit } from './transactionAudit.model.js';
import { User, UserProfile } from '../user/user.model.js';
import { validateAndApplyCoupon, incrementPromotionUsage } from '../catalog/catalog.controller.js';
import Catalog from '../catalog/catalog.model.js';

const getNumericAmount = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : NaN;
};

const MAX_TRANSFER_AMOUNT = Number.isFinite(config.transfers?.maxAmount) && config.transfers.maxAmount > 0
    ? config.transfers.maxAmount
    : 2000;

const MAX_DAILY_TRANSFER_BY_SOURCE = Number.isFinite(config.transfers?.maxDailyAmountBySource) && config.transfers.maxDailyAmountBySource > 0
    ? config.transfers.maxDailyAmountBySource
    : 10000;

const MAX_DAILY_TRANSFER_BY_DESTINATION = Number.isFinite(config.transfers?.maxDailyAmountByDestination) && config.transfers.maxDailyAmountByDestination > 0
    ? config.transfers.maxDailyAmountByDestination
    : 10000;

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

        const accounts = await Account.findAll({ where: whereClause });
        return res.status(200).json({ success: true, data: accounts });
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

        const {
            accountType,
            userId,
            perTransactionLimit,
            dailyTransactionLimit
        } = req.body;
        const finalAccountType = accountType || 'ahorro';
        
        let targetUserId;
        
        const isAdminOrEmployee = currentUserRole === 'Admin' || currentUserRole === 'Employee';

        if (currentUserRole === 'Client') {
            targetUserId = currentUserId;
        } else if (isAdminOrEmployee) {
            targetUserId = userId || currentUserId;
        } else {
            targetUserId = currentUserId;
        }
        
        const accountNumber = await generateAccountNumber(finalAccountType);

        const accountPayload = {
            accountNumber,
            userId: targetUserId,
            accountType: finalAccountType,
            status: true,
            accountBalance: 0
        };

        if (isAdminOrEmployee) {
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
        }

        const account = await Account.create(accountPayload);

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
            return res.status(400).json({ success: false, message: 'Moneda destino requerida' });
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
                    attributes: ['Name', 'Username', 'DocumentType', 'DocumentNumber']
                }
            ]
        });

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
                user,
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

            return res.status(400).json({
                success: false,
                message: 'La cuenta destino esta inactiva. Solicitud rechazada automaticamente'
            });
        }

        const destinationProfile = await UserProfile.findOne({
            where: { UserId: destinationAccount.userId },
            transaction: dbTransaction,
            lock: dbTransaction.LOCK.UPDATE
        });

        if (!destinationProfile) {
            depositRequest.status = 'FALLIDA';
            depositRequest.description = `${depositRequest.description || ''} | Rechazada: perfil del titular no encontrado`;
            await depositRequest.save({ transaction: dbTransaction });
            await dbTransaction.commit();

            return res.status(400).json({
                success: false,
                message: 'No se encontro el perfil del titular para validar limite de ingresos. Solicitud rechazada'
            });
        }

        const accountBalance = getNumericAmount(destinationAccount.accountBalance);
        const requestAmount = getNumericAmount(depositRequest.amount);
        const incomeLimit = getNumericAmount(destinationProfile.Income);

        if (!Number.isFinite(accountBalance) || !Number.isFinite(requestAmount) || !Number.isFinite(incomeLimit)) {
            depositRequest.status = 'FALLIDA';
            depositRequest.description = `${depositRequest.description || ''} | Rechazada: datos invalidos para validar limite`;
            await depositRequest.save({ transaction: dbTransaction });
            await dbTransaction.commit();

            return res.status(400).json({
                success: false,
                message: 'No fue posible validar el limite de ingresos. Solicitud rechazada'
            });
        }

        const resultingBalance = accountBalance + requestAmount;
        if (resultingBalance > incomeLimit) {
            depositRequest.status = 'FALLIDA';
            depositRequest.description = `${depositRequest.description || ''} | Rechazada por limite de ingresos (${incomeLimit.toFixed(2)})`;
            await depositRequest.save({ transaction: dbTransaction });
            await dbTransaction.commit();

            return res.status(400).json({
                success: false,
                message: 'Deposito rechazado: supera el limite de ingresos de la cuenta destinataria',
                data: {
                    incomeLimit: incomeLimit.toFixed(2),
                    currentBalance: accountBalance.toFixed(2),
                    requestedAmount: requestAmount.toFixed(2),
                    resultingBalance: resultingBalance.toFixed(2)
                }
            });
        }

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
            return res.status(400).json({
                success: false,
                message: 'Tipo de destinatario invalido. Valores permitidos: PROPIA o TERCERO'
            });
        }

        const numericAmount = getNumericAmount(amount);
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            await dbTransaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Monto invalido'
            });
        }

        if (numericAmount > MAX_TRANSFER_AMOUNT) {
            await dbTransaction.rollback();
            return res.status(400).json({
                success: false,
                message: `Transferencia rechazada: el monto excede el limite maximo por transaccion de Q${MAX_TRANSFER_AMOUNT}`
            });
        }

        if (sourceAccountNumber === destinationAccountNumber) {
            await dbTransaction.rollback();
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
            return res.status(404).json({
                success: false,
                message: 'Cuenta destino no encontrada'
            });
        }

        if (!sourceAccount.status || !destinationAccount.status) {
            await dbTransaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Ambas cuentas deben estar activas para realizar la transferencia'
            });
        }

        const isOwnDestination = destinationAccount.userId === currentUserId;
        if (normalizedRecipientType === 'PROPIA' && !isOwnDestination) {
            await dbTransaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'El tipo de destinatario PROPIA no coincide con la cuenta destino'
            });
        }

        if (normalizedRecipientType === 'TERCERO' && isOwnDestination) {
            await dbTransaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'El tipo de destinatario TERCERO no coincide con la cuenta destino'
            });
        }

        const sourceBalance = getNumericAmount(sourceAccount.accountBalance);
        if (!Number.isFinite(sourceBalance)) {
            await dbTransaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Saldo de cuenta origen invalido'
            });
        }

        if (sourceBalance < numericAmount) {
            await dbTransaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Saldo insuficiente'
            });
        }

        const destinationBalance = getNumericAmount(destinationAccount.accountBalance);
        if (!Number.isFinite(destinationBalance)) {
            await dbTransaction.rollback();
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

        const destinationReceivedTodayRaw = await Transaction.sum('amount', {
            where: {
                accountId: destinationAccount.id,
                type: 'TRANSFERENCIA_RECIBIDA',
                status: 'COMPLETADA',
                createdAt: {
                    [Op.between]: [start, end]
                }
            },
            transaction: dbTransaction
        });

        const sourceTransferredToday = getNumericAmount(sourceTransferredTodayRaw || 0);
        const destinationReceivedToday = getNumericAmount(destinationReceivedTodayRaw || 0);

        const sourceAfterThisTransfer = sourceTransferredToday + numericAmount;
        if (sourceAfterThisTransfer > MAX_DAILY_TRANSFER_BY_SOURCE) {
            await dbTransaction.rollback();
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

        const destinationAfterThisTransfer = destinationReceivedToday + numericAmount;
        if (destinationAfterThisTransfer > MAX_DAILY_TRANSFER_BY_DESTINATION) {
            await dbTransaction.rollback();
            return res.status(400).json({
                success: false,
                message: `Transferencia rechazada: la cuenta destino supera el limite diario de recepcion de Q${MAX_DAILY_TRANSFER_BY_DESTINATION}`,
                data: {
                    receivedToday: destinationReceivedToday.toFixed(2),
                    requestedAmount: numericAmount.toFixed(2),
                    projectedTotal: destinationAfterThisTransfer.toFixed(2)
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

        return res.status(200).json({
            success: true,
            message: appliedPromotion 
                ? `Transferencia realizada exitosamente con cupón ${appliedPromotion.name}` 
                : 'Transferencia realizada exitosamente',
            data: responseData
        });
    } catch (error) {
        await dbTransaction.rollback();
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
