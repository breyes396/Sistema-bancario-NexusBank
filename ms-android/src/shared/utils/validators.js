const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_SYMBOL_REGEX = /[@$!%*?&#]/;

export const isValidEmail = (value) => EMAIL_REGEX.test(String(value || '').trim());

export const isValidPhone = (value) => /^\d{8}$/.test(String(value || '').trim());

export const isValidDPI = (value) => /^\d{13}$/.test(String(value || '').trim());

// Mirrors the backend's strongPasswordValidator (middlewares/auth-validations.js)
// so the user gets the same feedback locally before hitting the API.
export const getPasswordErrors = (password) => {
    const value = String(password || '');
    const errors = [];

    if (value.length < 8) errors.push('Debe tener mínimo 8 caracteres');
    if (!/[A-Z]/.test(value)) errors.push('Debe contener al menos una mayúscula');
    if (!/[a-z]/.test(value)) errors.push('Debe contener al menos una minúscula');
    if (!/[0-9]/.test(value)) errors.push('Debe contener al menos un número');
    if (!PASSWORD_SYMBOL_REGEX.test(value)) errors.push('Debe contener al menos un símbolo (@$!%*?&#)');

    return errors;
};

export const isRequired = (value) => String(value ?? '').trim().length > 0;
