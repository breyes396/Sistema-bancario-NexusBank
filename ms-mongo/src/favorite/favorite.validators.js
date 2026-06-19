const VALID_ACCOUNT_TYPES = ['ahorro', 'corriente', 'savings', 'checking'];

export const normalizeFavoritePayload = (payload = {}) => {
    const accountNumber = String(payload.accountNumber || '').trim();
    const alias = String(payload.alias || '').trim();
    const accountType = String(payload.accountType || '').trim().toLowerCase();

    return {
        accountNumber,
        alias,
        accountType,
        isActive: payload.isActive
    };
};

export const validateFavoriteCreatePayload = ({ accountNumber, accountType, alias }) => {
    if (!accountNumber || !accountType || !alias) {
        return 'Todos los campos son obligatorios: accountNumber, accountType, alias';
    }

    if (!VALID_ACCOUNT_TYPES.includes(accountType)) {
        return 'Tipo de cuenta inválido. Debe ser: ahorro, corriente, savings o checking';
    }

    return null;
};

export const validateFavoriteUpdatePayload = ({ alias, accountType, isActive }) => {
    if (!alias && !accountType && isActive === undefined) {
        return 'Debe proporcionar al menos un campo para actualizar: alias, accountType o isActive';
    }

    if (accountType && !VALID_ACCOUNT_TYPES.includes(accountType)) {
        return 'Tipo de cuenta inválido. Debe ser: ahorro, corriente, savings o checking';
    }

    return null;
};
