export const isBlockedAccountStatus = (status) => {
    return ['FROZEN', 'SUSPENDED', 'BLOCKED'].includes(String(status || '').toUpperCase());
};

export const validateAccountLimitsPayload = ({ perTransactionLimit, dailyTransactionLimit }) => {
    if (perTransactionLimit !== undefined && perTransactionLimit !== null && Number(perTransactionLimit) < 0) {
        return 'Limite por operacion invalido';
    }

    if (dailyTransactionLimit !== undefined && dailyTransactionLimit !== null && Number(dailyTransactionLimit) < 0) {
        return 'Limite diario invalido';
    }

    return null;
};

export const validFreezeReasons = [
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
