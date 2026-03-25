'use strict';

const ALLOWED_ACCOUNT_TYPES = ['ahorro', 'corriente', 'nomina'];

export const validateAccountType = (req, res, next) => {
    const { accountType } = req.body;

    if (!accountType || accountType.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'El campo accountType es requerido',
            allowedTypes: ALLOWED_ACCOUNT_TYPES
        });
    }

    const normalizedType = accountType.toLowerCase().trim();

    if (!ALLOWED_ACCOUNT_TYPES.includes(normalizedType)) {
        return res.status(400).json({
            success: false,
            message: `Tipo de cuenta invalido: "${accountType}"`,
            allowedTypes: ALLOWED_ACCOUNT_TYPES
        });
    }

    // Normalizar el valor en el body para que sea consistente
    req.body.accountType = normalizedType;
    next();
};
