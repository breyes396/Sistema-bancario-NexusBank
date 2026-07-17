export const ACCOUNT_TYPE_OPTIONS = [
    { value: 'ahorro', label: 'Ahorro' },
    { value: 'corriente', label: 'Corriente' },
];

export const getFavoriteAccountTypeLabel = (type) => {
    const found = ACCOUNT_TYPE_OPTIONS.find((opt) => opt.value === String(type || '').toLowerCase());
    return found?.label || 'Ahorro';
};

export const normalizeFavoritePayload = (form = {}) => ({
    accountNumber: String(form.accountNumber || '').trim(),
    accountType: String(form.accountType || 'ahorro').trim().toLowerCase(),
    alias: String(form.alias || '').trim(),
});

// Misma regla que ms-mongo/src/favorite/favorite.validators.js: los tres
// campos son obligatorios; el tipo debe ser uno de los aceptados por el backend.
export const validateFavoriteForm = ({ accountNumber, accountType, alias }) => {
    if (!accountNumber || !accountType || !alias) {
        return 'Completa número de cuenta, tipo de cuenta y alias';
    }
    if (!['ahorro', 'corriente', 'savings', 'checking'].includes(accountType)) {
        return 'Tipo de cuenta inválido';
    }
    if (alias.length < 2) {
        return 'El alias debe tener al menos 2 caracteres';
    }
    return null;
};

export const filterFavoritesBySearch = (favorites = [], search = '') => {
    const term = search.trim().toLowerCase();
    if (!term) return favorites;
    return favorites.filter((favorite) =>
        String(favorite.alias || '').toLowerCase().includes(term) ||
        String(favorite.accountNumber || '').toLowerCase().includes(term)
    );
};
