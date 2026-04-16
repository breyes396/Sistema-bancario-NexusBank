'use strict';

import Favorite from './favorite.model.js';
import { sendError, sendSuccess } from '../../helpers/response.js';
import { ERROR_CODES } from '../../helpers/error-catalog.js';
import {
    normalizeFavoritePayload,
    validateFavoriteCreatePayload,
    validateFavoriteUpdatePayload
} from './favorite.validators.js';

const getAuthenticatedUserId = (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        sendError(res, {
            status: 401,
            code: ERROR_CODES.AUTH_REQUIRED,
            message: 'Usuario no autenticado'
        });
        return null;
    }
    return userId;
};

/**
 * POST /favorites
 * Crear una cuenta favorita
 */
export const createFavorite = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req, res);
        if (!userId) return;

        const { accountNumber, accountType, alias } = normalizeFavoritePayload(req.body);
        const validationError = validateFavoriteCreatePayload({ accountNumber, accountType, alias });
        if (validationError) {
            return sendError(res, {
                status: 400,
                code: ERROR_CODES.VALIDATION_ERROR,
                message: validationError
            });
        }

        // Verificar si ya existe ese número de cuenta como favorito del usuario
        const existingFavorite = await Favorite.findOne({
            userId,
            accountNumber: accountNumber.trim()
        });

        if (existingFavorite) {
            return sendError(res, {
                status: 409,
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'Esta cuenta ya está en tus favoritos',
                details: {
                    existingAlias: existingFavorite.alias,
                    existingId: existingFavorite._id
                }
            });
        }

        // Crear el favorito
        const newFavorite = await Favorite.create({
            userId,
            accountNumber,
            accountType,
            alias
        });

        return sendSuccess(res, {
            status: 201,
            message: 'Cuenta favorita agregada exitosamente',
            data: {
                id: newFavorite._id,
                accountNumber: newFavorite.accountNumber,
                accountType: newFavorite.accountType,
                alias: newFavorite.alias,
                createdAt: newFavorite.createdAt
            }
        });

    } catch (error) {
        console.error('Error creando favorito:', error);

        // Error de duplicado por índice único
        if (error.code === 11000) {
            return sendError(res, {
                status: 409,
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'Esta cuenta ya está en tus favoritos'
            });
        }

        // Error de validación de Mongoose
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return sendError(res, {
                status: 400,
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'Error de validación',
                details: messages
            });
        }

        return sendError(res, {
            status: 500,
            code: ERROR_CODES.INTERNAL_ERROR,
            message: 'Error en el servidor',
            details: error.message
        });
    }
};

/**
 * GET /favorites
 * Listar todos los favoritos del usuario autenticado
 */
export const getFavorites = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req, res);
        if (!userId) return;

        // Obtener filtros opcionales
        const { isActive, search } = req.query;

        // Construir query
        const query = { userId };

        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        // Búsqueda por alias o número de cuenta
        if (search) {
            query.$or = [
                { alias: { $regex: search, $options: 'i' } },
                { accountNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const favorites = await Favorite.find(query)
            .select('_id accountNumber accountType alias isActive createdAt updatedAt')
            .sort({ createdAt: -1 });

        return sendSuccess(res, {
            status: 200,
            message: 'Favoritos obtenidos exitosamente',
            data: {
                favorites,
                total: favorites.length
            }
        });

    } catch (error) {
        console.error('Error obteniendo favoritos:', error);
        return sendError(res, {
            status: 500,
            code: ERROR_CODES.INTERNAL_ERROR,
            message: 'Error en el servidor',
            details: error.message
        });
    }
};

/**
 * GET /favorites/:id
 * Obtener un favorito específico
 */
export const getFavoriteById = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req, res);
        if (!userId) return;
        const { id } = req.params;

        const favorite = await Favorite.findOne({
            _id: id,
            userId
        });

        if (!favorite) {
            return sendError(res, {
                status: 404,
                code: ERROR_CODES.NOT_FOUND,
                message: 'Favorito no encontrado o no te pertenece'
            });
        }

        return sendSuccess(res, {
            status: 200,
            message: 'Favorito obtenido exitosamente',
            data: favorite
        });

    } catch (error) {
        console.error('Error obteniendo favorito:', error);
        return sendError(res, {
            status: 500,
            code: ERROR_CODES.INTERNAL_ERROR,
            message: 'Error en el servidor',
            details: error.message
        });
    }
};

/**
 * PUT /favorites/:id
 * Editar el alias de un favorito existente
 */
export const updateFavorite = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req, res);
        if (!userId) return;
        const { id } = req.params;
        const { alias, accountType, isActive } = normalizeFavoritePayload(req.body);

        const validationError = validateFavoriteUpdatePayload({ alias, accountType, isActive });
        if (validationError) {
            return sendError(res, {
                status: 400,
                code: ERROR_CODES.VALIDATION_ERROR,
                message: validationError
            });
        }

        // Buscar el favorito
        const favorite = await Favorite.findOne({
            _id: id,
            userId
        });

        if (!favorite) {
            return sendError(res, {
                status: 404,
                code: ERROR_CODES.NOT_FOUND,
                message: 'Favorito no encontrado o no te pertenece'
            });
        }

        // Actualizar campos
        if (alias) {
            favorite.alias = alias.trim();
        }

        if (accountType) {
            favorite.accountType = accountType;
        }

        if (isActive !== undefined) {
            favorite.isActive = Boolean(isActive);
        }

        await favorite.save();

        return sendSuccess(res, {
            status: 200,
            message: 'Favorito actualizado exitosamente',
            data: {
                id: favorite._id,
                accountNumber: favorite.accountNumber,
                accountType: favorite.accountType,
                alias: favorite.alias,
                isActive: favorite.isActive,
                updatedAt: favorite.updatedAt
            }
        });

    } catch (error) {
        console.error('Error actualizando favorito:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return sendError(res, {
                status: 400,
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'Error de validación',
                details: messages
            });
        }

        return sendError(res, {
            status: 500,
            code: ERROR_CODES.INTERNAL_ERROR,
            message: 'Error en el servidor',
            details: error.message
        });
    }
};

/**
 * DELETE /favorites/:id
 * Eliminar un favorito existente
 */
export const deleteFavorite = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req, res);
        if (!userId) return;
        const { id } = req.params;

        const favorite = await Favorite.findOneAndDelete({
            _id: id,
            userId
        });

        if (!favorite) {
            return sendError(res, {
                status: 404,
                code: ERROR_CODES.NOT_FOUND,
                message: 'Favorito no encontrado o no te pertenece'
            });
        }

        return sendSuccess(res, {
            status: 200,
            message: 'Favorito eliminado exitosamente',
            data: {
                id: favorite._id,
                alias: favorite.alias,
                accountNumber: favorite.accountNumber
            }
        });

    } catch (error) {
        console.error('Error eliminando favorito:', error);
        return sendError(res, {
            status: 500,
            code: ERROR_CODES.INTERNAL_ERROR,
            message: 'Error en el servidor',
            details: error.message
        });
    }
};
