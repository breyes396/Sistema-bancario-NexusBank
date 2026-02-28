import { Account } from './account.model.js';
import { generateAccountNumber } from '../../helpers/account-generator.js';
import { getExchangeRate } from '../../helpers/fx-service.js';
import sequelize from '../../configs/db.js';
import config from '../../configs/config.js';
import { Op } from 'sequelize';
import { Transaction } from './transaction.model.js';
import { AccountLimitAudit } from './accountLimitAudit.model.js';
import { User, UserProfile } from '../user/user.model.js';

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

        destinationAccount.accountBalance = resultingBalance.toFixed(2);
        await destinationAccount.save({ transaction: dbTransaction });

        depositRequest.status = 'COMPLETADA';
        depositRequest.balanceAfter = resultingBalance.toFixed(2);
        depositRequest.description = `${depositRequest.description || ''} | Aprobada por ${approverUserId}`;
        await depositRequest.save({ transaction: dbTransaction });

        await dbTransaction.commit();

        return res.status(200).json({
            success: true,
            message: 'Deposito aprobado exitosamente',
            data: {
                transactionId: depositRequest.id,
                accountId: destinationAccount.id,
                newBalance: destinationAccount.accountBalance
            }
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

        const sourceNewBalance = sourceBalance - numericAmount;
        const destinationNewBalance = destinationBalance + numericAmount;

        sourceAccount.accountBalance = sourceNewBalance.toFixed(2);
        destinationAccount.accountBalance = destinationNewBalance.toFixed(2);

        await sourceAccount.save({ transaction: dbTransaction });
        await destinationAccount.save({ transaction: dbTransaction });

        const transferDescription = description || `Transferencia ${normalizedRecipientType.toLowerCase()}`;

        const sentTransaction = await Transaction.create({
            accountId: sourceAccount.id,
            type: 'TRANSFERENCIA_ENVIADA',
            amount: numericAmount.toFixed(2),
            description: transferDescription,
            balanceAfter: sourceNewBalance.toFixed(2),
            relatedAccountId: destinationAccount.id,
            status: 'COMPLETADA'
        }, { transaction: dbTransaction });

        await Transaction.create({
            accountId: destinationAccount.id,
            type: 'TRANSFERENCIA_RECIBIDA',
            amount: numericAmount.toFixed(2),
            description: transferDescription,
            balanceAfter: destinationNewBalance.toFixed(2),
            relatedAccountId: sourceAccount.id,
            status: 'COMPLETADA'
        }, { transaction: dbTransaction });

        await dbTransaction.commit();

        return res.status(200).json({
            success: true,
            message: 'Transferencia realizada exitosamente',
            data: {
                transactionId: sentTransaction.id,
                sourceAccountId: sourceAccount.id,
                destinationAccountId: destinationAccount.id,
                recipientType: normalizedRecipientType,
                amount: numericAmount.toFixed(2),
                sourceNewBalance: sourceNewBalance.toFixed(2),
                destinationNewBalance: destinationNewBalance.toFixed(2)
            }
        });
    } catch (error) {
        await dbTransaction.rollback();
        return res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
};
