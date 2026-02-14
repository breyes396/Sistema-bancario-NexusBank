'use strict';

import mongoose from 'mongoose';

const ALLOWED_CATEGORIES = [
    'CUENTAS',
    'CREDITOS',
    'INVERSIONES',
    'SEGUROS',
    'TRANSFERENCIAS',
    'ASESORAMIENTO'
];

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const parseNumber = (value) => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }

    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
};

const validateObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const respondValidationError = (res, errors) => {
    return res.status(400).json({
        success: false,
        message: 'Validacion fallida',
        errors
    });
};

export const validateCreateProduct = (req, res, next) => {
    const errors = [];
    const { name, description, price, category } = req.body;

    if (!isNonEmptyString(name)) {
        errors.push('El nombre es requerido');
    }

    if (!isNonEmptyString(description)) {
        errors.push('La descripcion es requerida');
    }

    const parsedPrice = parseNumber(price);
    if (parsedPrice === null || parsedPrice < 0) {
        errors.push('El precio debe ser un numero mayor o igual a 0');
    }

    if (!isNonEmptyString(category)) {
        errors.push('La categoria es requerida');
    } else {
        const normalizedCategory = category.trim().toUpperCase();
        if (!ALLOWED_CATEGORIES.includes(normalizedCategory)) {
            errors.push('La categoria no es valida');
        } else {
            req.body.category = normalizedCategory;
        }
    }

    if (errors.length > 0) {
        return respondValidationError(res, errors);
    }

    req.body.name = name.trim();
    req.body.description = description.trim();
    req.body.price = parsedPrice;

    return next();
};

export const validateUpdateProductRequest = (req, res, next) => {
    const errors = [];
    const allowedFields = ['name', 'description', 'price', 'category'];
    const receivedFields = Object.keys(req.body || {});

    if (receivedFields.length === 0) {
        return respondValidationError(res, ['Debe enviar al menos un campo para actualizar']);
    }

    const unknownFields = receivedFields.filter((field) => !allowedFields.includes(field));
    if (unknownFields.length > 0) {
        return respondValidationError(res, [`Campos no permitidos: ${unknownFields.join(', ')}`]);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
        if (!isNonEmptyString(req.body.name)) {
            errors.push('El nombre es requerido');
        } else {
            req.body.name = req.body.name.trim();
        }
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'description')) {
        if (!isNonEmptyString(req.body.description)) {
            errors.push('La descripcion es requerida');
        } else {
            req.body.description = req.body.description.trim();
        }
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'price')) {
        const parsedPrice = parseNumber(req.body.price);
        if (parsedPrice === null || parsedPrice < 0) {
            errors.push('El precio debe ser un numero mayor o igual a 0');
        } else {
            req.body.price = parsedPrice;
        }
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'category')) {
        if (!isNonEmptyString(req.body.category)) {
            errors.push('La categoria es requerida');
        } else {
            const normalizedCategory = req.body.category.trim().toUpperCase();
            if (!ALLOWED_CATEGORIES.includes(normalizedCategory)) {
                errors.push('La categoria no es valida');
            } else {
                req.body.category = normalizedCategory;
            }
        }
    }

    if (errors.length > 0) {
        return respondValidationError(res, errors);
    }

    return next();
};

export const validateGetProductById = (req, res, next) => {
    const { id } = req.params;

    if (!validateObjectId(id)) {
        return respondValidationError(res, ['Id de producto invalido']);
    }

    return next();
};

export const validateProductStatusChange = (req, res, next) => {
    const { id } = req.params;

    if (!validateObjectId(id)) {
        return respondValidationError(res, ['Id de producto invalido']);
    }

    return next();
};
