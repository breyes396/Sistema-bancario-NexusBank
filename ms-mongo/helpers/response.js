import { ERROR_CODES } from './error-catalog.js';

export const sendSuccess = (res, {
    status = 200,
    message = 'OK',
    data = null,
    metadata = null
} = {}) => {
    const payload = {
        success: true,
        code: null,
        message,
        data,
        timestamp: new Date().toISOString()
    };

    if (metadata) {
        payload.metadata = metadata;
    }

    return res.status(status).json(payload);
};

export const sendError = (res, {
    status = 400,
    code = ERROR_CODES.VALIDATION_ERROR,
    message = 'Solicitud invalida',
    details = null
} = {}) => {
    const payload = {
        success: false,
        code,
        message,
        timestamp: new Date().toISOString()
    };

    if (details !== null && details !== undefined) {
        payload.details = details;
    }

    return res.status(status).json(payload);
};
