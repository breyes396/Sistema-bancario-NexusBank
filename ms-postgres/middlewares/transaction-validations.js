'use strict';

const ALLOWED_TRANSACTION_TYPES = [
    'DEPOSITO',
    'RETIRO',
    'TRANSFERENCIA_ENVIADA',
    'TRANSFERENCIA_RECIBIDA',
    'COMPRA'
];

const ALLOWED_TRANSACTION_STATUS = [
    'COMPLETADA',
    'PENDIENTE',
    'FALLIDA',
    'REVERTIDA'
];

const ALLOWED_CLIENT_QUERY_KEYS = ['type', 'status', 'page', 'limit'];
const ALLOWED_EMPLOYEE_QUERY_KEYS = ['type', 'status', 'page', 'limit'];
const ALLOWED_ADMIN_QUERY_KEYS = ['accountId', 'userId', 'type', 'status', 'startDate', 'endDate', 'page', 'limit'];

const ACCOUNT_ID_PATTERN = /^acc_[123456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz]{12}$/;
const USER_ID_PATTERN = /^usr_[123456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz]{12}$/;

const respondValidationError = (res, errors) => {
    return res.status(400).json({
        success: false,
        message: 'Validacion fallida',
        errors
    });
};

const validateUnknownQueryKeys = (queryObject, allowedKeys, errors) => {
    const receivedKeys = Object.keys(queryObject || {});
    const unknownKeys = receivedKeys.filter((key) => !allowedKeys.includes(key));

    if (unknownKeys.length > 0) {
        errors.push(`Query params no permitidos: ${unknownKeys.join(', ')}`);
    }
};

const normalizeTransactionFilters = (req, errors) => {
    if (req.query.type !== undefined) {
        const normalizedType = String(req.query.type).trim().toUpperCase();
        if (!ALLOWED_TRANSACTION_TYPES.includes(normalizedType)) {
            errors.push(`Tipo de transaccion invalido. Valores permitidos: ${ALLOWED_TRANSACTION_TYPES.join(', ')}`);
        } else {
            req.query.type = normalizedType;
        }
    }

    if (req.query.status !== undefined) {
        const normalizedStatus = String(req.query.status).trim().toUpperCase();
        if (!ALLOWED_TRANSACTION_STATUS.includes(normalizedStatus)) {
            errors.push(`Estado de transaccion invalido. Valores permitidos: ${ALLOWED_TRANSACTION_STATUS.join(', ')}`);
        } else {
            req.query.status = normalizedStatus;
        }
    }
};

const normalizePagination = (req, errors) => {
    if (req.query.page !== undefined) {
        const parsedPage = Number.parseInt(req.query.page, 10);
        if (!Number.isFinite(parsedPage) || parsedPage < 1) {
            errors.push('El parametro page debe ser un entero mayor o igual a 1');
        } else {
            req.query.page = String(parsedPage);
        }
    }

    if (req.query.limit !== undefined) {
        const parsedLimit = Number.parseInt(req.query.limit, 10);
        if (!Number.isFinite(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
            errors.push('El parametro limit debe ser un entero entre 1 y 100');
        } else {
            req.query.limit = String(parsedLimit);
        }
    }
};

const normalizeAdminSpecificFilters = (req, errors) => {
    if (req.query.accountId !== undefined) {
        const normalizedAccountId = String(req.query.accountId).trim();
        if (!ACCOUNT_ID_PATTERN.test(normalizedAccountId)) {
            errors.push('Formato de accountId invalido');
        } else {
            req.query.accountId = normalizedAccountId;
        }
    }

    if (req.query.userId !== undefined) {
        const normalizedUserId = String(req.query.userId).trim();
        if (!USER_ID_PATTERN.test(normalizedUserId)) {
            errors.push('Formato de userId invalido');
        } else {
            req.query.userId = normalizedUserId;
        }
    }

    if (req.query.startDate !== undefined) {
        const parsedStartDate = new Date(req.query.startDate);
        if (Number.isNaN(parsedStartDate.getTime())) {
            errors.push('El parametro startDate es invalido');
        }
    }

    if (req.query.endDate !== undefined) {
        const parsedEndDate = new Date(req.query.endDate);
        if (Number.isNaN(parsedEndDate.getTime())) {
            errors.push('El parametro endDate es invalido');
        }
    }

    if (req.query.startDate !== undefined && req.query.endDate !== undefined) {
        const parsedStartDate = new Date(req.query.startDate);
        const parsedEndDate = new Date(req.query.endDate);
        if (!Number.isNaN(parsedStartDate.getTime()) && !Number.isNaN(parsedEndDate.getTime()) && parsedStartDate > parsedEndDate) {
            errors.push('startDate no puede ser mayor que endDate');
        }
    }
};

export const validateClientTransactionsQuery = (req, res, next) => {
    const errors = [];

    validateUnknownQueryKeys(req.query, ALLOWED_CLIENT_QUERY_KEYS, errors);
    normalizeTransactionFilters(req, errors);
    normalizePagination(req, errors);

    if (errors.length > 0) {
        return respondValidationError(res, errors);
    }

    return next();
};

export const validateAdminTransactionsQuery = (req, res, next) => {
    const errors = [];

    validateUnknownQueryKeys(req.query, ALLOWED_ADMIN_QUERY_KEYS, errors);
    normalizeTransactionFilters(req, errors);
    normalizePagination(req, errors);
    normalizeAdminSpecificFilters(req, errors);

    if (errors.length > 0) {
        return respondValidationError(res, errors);
    }

    return next();
};

export const validateEmployeeAccountTransactions = (req, res, next) => {
    const errors = [];

    const { accountId } = req.params;
    if (!accountId || !ACCOUNT_ID_PATTERN.test(String(accountId).trim())) {
        errors.push('Formato de accountId invalido');
    }

    validateUnknownQueryKeys(req.query, ALLOWED_EMPLOYEE_QUERY_KEYS, errors);
    normalizeTransactionFilters(req, errors);
    normalizePagination(req, errors);

    if (errors.length > 0) {
        return respondValidationError(res, errors);
    }

    req.params.accountId = String(accountId).trim();
    return next();
};
