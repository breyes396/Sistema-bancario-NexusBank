import { Account } from './account.model.js';
import { generateAccountNumber } from '../../helpers/account-generator.js';
import { getExchangeRate } from '../../helpers/fx-service.js';
import sequelize from '../../configs/db.js';
import { Op } from 'sequelize';
import { AccountLimitAudit } from './accountLimitAudit.model.js';
import { AccountBlockHistory } from './accountBlockHistory.model.js';
import { User, UserProfile } from '../user/user.model.js';
import { Role, UserRole } from '../auth/role.model.js';
import { applyExposureRulesByRole } from '../user/services/user-masking.service.js';
import { getUserEmailAndName, sendEmailSafe } from './services/account-contact.service.js';
import { validateAccountLimitsPayload, isBlockedAccountStatus, validFreezeReasons } from './services/account-rules.service.js';
import {
    sendAccountCreatedEmail,
    sendAccountApprovedEmail,
    sendAccountRejectedEmail,
    sendSecurityChangeEmail,
    sendAccountFrozenEmail,
    sendAccountUnfrozenEmail
} from '../../services/email.service.js';
import {
    AUDIT_ACTIONS,
    AUDIT_RESOURCES,
    recordAuditEvent
} from '../../services/audit.service.js';
import { generateEmailVerificationToken } from '../../services/auth/token.service.js';

const findUserByRequestPayload = async ({ userId, email }) => {
    const normalizedUserId = (userId || '').toString().trim();
    const normalizedEmail = (email || '').toString().trim().toLowerCase();

    if (normalizedUserId) {
        return User.findByPk(normalizedUserId, { attributes: ['id', 'email', 'status', 'isVerified'] });
    }

    if (normalizedEmail) {
        return User.findOne({
            where: { email: normalizedEmail },
            attributes: ['id', 'email', 'status', 'isVerified']
        });
    }

    return null;
};

const hasRestrictedAccountByType = async ({ userId, accountType }) => {
    const existingAccount = await Account.findOne({
        where: {
            userId,
            accountType,
            accountStatus: {
                [Op.in]: ['ACTIVE', 'UNDER_REVIEW', 'FROZEN', 'SUSPENDED', 'BLOCKED']
            }
        },
        attributes: ['id', 'accountNumber', 'status', 'accountStatus']
    });

    return existingAccount;
};

const isClientUser = async (userId) => {
    const userRole = await UserRole.findOne({ where: { UserId: userId } });
    if (!userRole) return false;

    const role = await Role.findByPk(userRole.RoleId, { attributes: ['name'] });
    if (!role?.name) return false;

    return ['Cliente', 'Client'].includes(String(role.name));
};

const getNumericAmount = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : NaN;
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

export const requestAccountWithoutToken = async (req, res) => {
    try {
        const { accountType } = req.body;
        const userId = req.body?.userId || req.body?.idCliente;
        const email = req.body?.email;

        if (!userId && !email) {
            return res.status(400).json({
                success: false,
                message: 'Debe enviar userId/idCliente o email para solicitar la cuenta'
            });
        }

        const targetUser = await findUserByRequestPayload({ userId, email });
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado para la solicitud de cuenta'
            });
        }

        if (!targetUser.status) {
            return res.status(400).json({
                success: false,
                message: 'El usuario se encuentra inactivo y no puede solicitar cuentas'
            });
        }

        const userIsClient = await isClientUser(targetUser.id);
        if (!userIsClient) {
            return res.status(403).json({
                success: false,
                message: 'Solo usuarios con rol Cliente pueden solicitar cuentas por esta vía'
            });
        }

        const restrictedAccount = await hasRestrictedAccountByType({ userId: targetUser.id, accountType });
        if (restrictedAccount) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe una cuenta de este tipo para el usuario',
                data: {
                    existingAccountId: restrictedAccount.id,
                    existingAccountNumber: restrictedAccount.accountNumber,
                    existingStatus: restrictedAccount.accountStatus,
                    enabled: restrictedAccount.status
                }
            });
        }

        const accountNumber = await generateAccountNumber(accountType);
        const account = await Account.create({
            accountNumber,
            userId: targetUser.id,
            accountType,
            status: false,
            accountStatus: 'UNDER_REVIEW',
            accountBalance: 0,
            openedAt: null,
            lastAdminChangeType: 'REQUEST_CREATE',
            lastAdminChangeReason: 'Solicitud de cuenta sin token - pendiente de habilitacion'
        });

        const accountOwner = await getUserEmailAndName(targetUser.id);
        if (accountOwner) {
            await sendEmailSafe(() => sendSecurityChangeEmail(accountOwner.email, accountOwner.name, {
                accountNumber: account.accountNumber,
                changeType: 'Solicitud de cuenta recibida',
                changes: {
                    accountType: account.accountType,
                    status: account.status,
                    accountStatus: account.accountStatus
                },
                reason: 'La solicitud fue registrada y esta pendiente de aprobacion administrativa'
            }));
        }

        return res.status(201).json({
            success: true,
            message: 'Solicitud de cuenta registrada. La cuenta quedó deshabilitada y pendiente de habilitación.',
            data: {
                id: account.id,
                accountNumber: account.accountNumber,
                accountType: account.accountType,
                status: account.status,
                accountStatus: account.accountStatus,
                userId: account.userId
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
};

export const enableRequestedAccount = async (req, res) => {
    try {
        const actorUserId = req.user?.id;
        const actorRole = req.user?.role;
        const { id: accountId } = req.params;
        const { reason } = req.body || {};

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

        if (account.status === true && account.accountStatus === 'ACTIVE') {
            return res.status(400).json({ success: false, message: 'La cuenta ya se encuentra habilitada' });
        }

        if (!['UNDER_REVIEW', 'CLOSED'].includes(account.accountStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Solo se pueden habilitar cuentas en estado UNDER_REVIEW o CLOSED',
                data: { currentStatus: account.accountStatus }
            });
        }

        await account.update({
            status: true,
            accountStatus: 'ACTIVE',
            openedAt: new Date(),
            lastAdminChangeBy: actorUserId,
            lastAdminChangeAt: new Date(),
            lastAdminChangeType: 'REQUEST_ENABLE',
            lastAdminChangeReason: reason || 'Habilitacion de cuenta solicitada sin token'
        });

        // Generar token de verificación y marcar como aprobado
        const user = await User.findByPk(account.userId);
        if (user) {
            user.isApproved = true;
            await user.save();

            // Generar token de verificación
            const verificationToken = generateEmailVerificationToken(user.id);

            // Obtener datos del usuario para el email
            const accountOwner = await getUserEmailAndName(account.userId);
            if (accountOwner) {
                await sendEmailSafe(() => sendAccountApprovedEmail(
                    accountOwner.email,
                    accountOwner.name,
                    verificationToken
                ));
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Cuenta habilitada exitosamente',
            data: {
                id: account.id,
                accountNumber: account.accountNumber,
                status: account.status,
                accountStatus: account.accountStatus,
                openedAt: account.openedAt,
                enabledBy: actorUserId
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
};

export const rejectRequestedAccount = async (req, res) => {
    try {
        const actorUserId = req.user?.id;
        const actorRole = req.user?.role;
        const { id: accountId } = req.params;
        const { reason } = req.body || {};

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

        if (account.accountStatus !== 'UNDER_REVIEW') {
            return res.status(400).json({
                success: false,
                message: 'Solo se pueden rechazar cuentas en estado UNDER_REVIEW',
                data: { currentStatus: account.accountStatus }
            });
        }

        await account.update({
            status: false,
            accountStatus: 'CLOSED',
            lastAdminChangeBy: actorUserId,
            lastAdminChangeAt: new Date(),
            lastAdminChangeType: 'REQUEST_REJECT',
            lastAdminChangeReason: reason || 'Rechazo de cuenta solicitada'
        });

        const accountOwner = await getUserEmailAndName(account.userId);
        if (accountOwner) {
            await sendEmailSafe(() => sendAccountRejectedEmail(
                accountOwner.email,
                accountOwner.name,
                reason || 'No se cumplieron los requisitos para la apertura de la cuenta.'
            ));
        }

        return res.status(200).json({
            success: true,
            message: 'Cuenta rechazada exitosamente',
            data: {
                id: account.id,
                accountNumber: account.accountNumber,
                status: account.status,
                accountStatus: account.accountStatus,
                rejectedBy: actorUserId
            }
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
        const limitsValidationError = validateAccountLimitsPayload({ perTransactionLimit, dailyTransactionLimit });
        if (limitsValidationError) {
            return res.status(400).json({ success: false, message: limitsValidationError });
        }

        if (perTransactionLimit !== undefined) {
            updates.perTransactionLimit = perTransactionLimit;
        }

        if (dailyTransactionLimit !== undefined) {
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
            await recordAuditEvent({
                req,
                actorUserId: null,
                action: AUDIT_ACTIONS.LIMIT_CHANGE,
                resource: AUDIT_RESOURCES.ACCOUNT_LIMITS,
                result: 'DENIED',
                metadata: { accountId, reason: 'AUTH_REQUIRED' }
            });

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
        const limitsValidationError = validateAccountLimitsPayload({ perTransactionLimit, dailyTransactionLimit });

        if (limitsValidationError) {
            await createAccountLimitAudit({
                req,
                actorUserId,
                accountId,
                action: 'LIMITS_UPDATE',
                outcome: 'DENIED',
                previousPerTransactionLimit,
                previousDailyTransactionLimit,
                previousStatus,
                reason: limitsValidationError
            });

            return res.status(400).json({ success: false, message: limitsValidationError });
        }

        if (perTransactionLimit !== undefined) {
            updates.perTransactionLimit = perTransactionLimit;
        }

        if (dailyTransactionLimit !== undefined) {
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

        await recordAuditEvent({
            req,
            actorUserId,
            action: AUDIT_ACTIONS.LIMIT_CHANGE,
            resource: AUDIT_RESOURCES.ACCOUNT_LIMITS,
            result: 'SUCCESS',
            beforeState: {
                perTransactionLimit: previousPerTransactionLimit,
                dailyTransactionLimit: previousDailyTransactionLimit,
                status: previousStatus
            },
            afterState: {
                perTransactionLimit: account.perTransactionLimit,
                dailyTransactionLimit: account.dailyTransactionLimit,
                status: account.status
            },
            metadata: {
                accountId,
                reason: updates.lastAdminChangeReason
            }
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

        await recordAuditEvent({
            req,
            actorUserId,
            action: AUDIT_ACTIONS.LIMIT_CHANGE,
            resource: AUDIT_RESOURCES.ACCOUNT_LIMITS,
            result: 'ERROR',
            metadata: {
                accountId,
                error: error.message
            }
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

        const maskedUser = user 
            ? applyExposureRulesByRole(user, actorRole, actorUserId)
            : null;

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
                } : user
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

        if (!reason || !validFreezeReasons.includes(reason)) {
            return res.status(400).json({
                success: false,
                message: 'Razón inválida',
                validReasons: validFreezeReasons
            });
        }

        const account = await Account.findByPk(accountId);

        if (!account) {
            await recordAuditEvent({
                req,
                actorUserId,
                action: AUDIT_ACTIONS.FREEZE_ACCOUNT,
                resource: AUDIT_RESOURCES.ACCOUNT_SECURITY,
                result: 'NOT_FOUND',
                metadata: { accountId }
            });

            return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
        }

        if (account.accountStatus === 'FROZEN') {
            return res.status(400).json({
                success: false,
                message: 'La cuenta ya está congelada',
                currentStatus: account.accountStatus
            });
        }

        if (account.accountStatus === 'CLOSED') {
            return res.status(400).json({
                success: false,
                message: 'No se puede congelar una cuenta cerrada',
                currentStatus: account.accountStatus
            });
        }

        const previousStatus = account.accountStatus;

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

        await recordAuditEvent({
            req,
            actorUserId,
            action: AUDIT_ACTIONS.FREEZE_ACCOUNT,
            resource: AUDIT_RESOURCES.ACCOUNT_SECURITY,
            result: 'SUCCESS',
            beforeState: { status: previousStatus },
            afterState: { status: 'FROZEN' },
            metadata: {
                accountId,
                reason,
                reasonDetails: reasonDetails || null
            }
        });

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

        await recordAuditEvent({
            req,
            actorUserId: req.user?.id || null,
            action: AUDIT_ACTIONS.FREEZE_ACCOUNT,
            resource: AUDIT_RESOURCES.ACCOUNT_SECURITY,
            result: 'ERROR',
            metadata: {
                accountId: req.params?.id,
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
            await recordAuditEvent({
                req,
                actorUserId,
                action: AUDIT_ACTIONS.UNFREEZE_ACCOUNT,
                resource: AUDIT_RESOURCES.ACCOUNT_SECURITY,
                result: 'NOT_FOUND',
                metadata: { accountId }
            });

            return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
        }

        if (!isBlockedAccountStatus(account.accountStatus)) {
            return res.status(400).json({
                success: false,
                message: 'La cuenta no está congelada o suspendida',
                currentStatus: account.accountStatus
            });
        }

        const previousStatus = account.accountStatus;

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

        await recordAuditEvent({
            req,
            actorUserId,
            action: AUDIT_ACTIONS.UNFREEZE_ACCOUNT,
            resource: AUDIT_RESOURCES.ACCOUNT_SECURITY,
            result: 'SUCCESS',
            beforeState: { status: previousStatus },
            afterState: { status: 'ACTIVE' },
            metadata: {
                accountId,
                reason: reasonDetails || reason || 'Cuenta rehabilitada'
            }
        });

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

        await recordAuditEvent({
            req,
            actorUserId: req.user?.id || null,
            action: AUDIT_ACTIONS.UNFREEZE_ACCOUNT,
            resource: AUDIT_RESOURCES.ACCOUNT_SECURITY,
            result: 'ERROR',
            metadata: {
                accountId: req.params?.id,
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

        const history = await AccountBlockHistory.find({ accountId })
            .sort({ createdAt: -1 })
            .lean();

        const performerIds = [...new Set(history.map((h) => h.performedBy).filter(Boolean))];
        const performers = performerIds.length
            ? await User.findAll({
                where: { id: { [Op.in]: performerIds } },
                attributes: ['id', 'email']
            })
            : [];

        const performerEmailById = new Map(performers.map((u) => [u.id, u.email]));

        return res.status(200).json({
            success: true,
            message: 'Historial de bloqueos obtenido exitosamente',
            data: {
                accountId,
                accountNumber: account.accountNumber,
                currentStatus: account.accountStatus,
                history: history.map(h => ({
                    id: h._id,
                    action: h.action,
                    previousStatus: h.previousStatus,
                    newStatus: h.newStatus,
                    reason: h.reason,
                    reasonDetails: h.reasonDetails,
                    performedBy: h.performedBy,
                    performedByEmail: performerEmailById.get(h.performedBy) || null,
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
