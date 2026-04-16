import { ERROR_CODES } from '../helpers/error-catalog.js';
import { sendError } from '../helpers/response.js';

export const notFoundHandler = (req, res) => {
    return sendError(res, {
        status: 404,
        code: ERROR_CODES.NOT_FOUND,
        message: 'Endpoint no encontrado en API',
        details: {
            method: req.method,
            path: req.originalUrl
        }
    });
};

export const globalErrorHandler = (error, req, res, next) => {
    const status = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
    const code = error?.code || ERROR_CODES.INTERNAL_ERROR;
    const message = error?.message || 'Error en el servidor';

    if (res.headersSent) {
        return next(error);
    }

    return sendError(res, {
        status,
        code,
        message,
        details: process.env.NODE_ENV === 'production'
            ? null
            : {
                stack: error?.stack,
                rawMessage: error?.message
            }
    });
};
