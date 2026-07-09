import { AuditEvent } from '../src/audit/auditEvent.model.js';

export const AUDIT_ACTIONS = {
    LOGIN: 'LOGIN',
    LIMIT_CHANGE: 'LIMIT_CHANGE',
    DEPOSIT_APPROVAL: 'DEPOSIT_APPROVAL',
    DEPOSIT_REVERSAL: 'DEPOSIT_REVERSAL',
    TRANSFER: 'TRANSFER',
    TRANSFER_REVERSAL: 'TRANSFER_REVERSAL',
    FREEZE_ACCOUNT: 'FREEZE_ACCOUNT',
    UNFREEZE_ACCOUNT: 'UNFREEZE_ACCOUNT'
};

export const AUDIT_RESOURCES = {
    AUTH: 'AUTH',
    ACCOUNT_LIMITS: 'ACCOUNT_LIMITS',
    DEPOSIT: 'DEPOSIT',
    TRANSFER: 'TRANSFER',
    ACCOUNT_SECURITY: 'ACCOUNT_SECURITY'
};

const getIpAddress = (req) => {
    if (!req) return null;
    return req.headers?.['x-forwarded-for'] || req.connection?.remoteAddress || req.ip || null;
};

export const recordAuditEvent = async ({
    req,
    actorUserId = null,
    action,
    resource,
    result,
    beforeState = null,
    afterState = null,
    metadata = null
}) => {
    try {
        await AuditEvent.create({
            actorUserId,
            action,
            resource,
            result,
            beforeState,
            afterState,
            ipAddress: getIpAddress(req),
            userAgent: req?.headers?.['user-agent'] || null,
            metadata,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Error registrando auditoria transversal:', error.message);
    }
};
