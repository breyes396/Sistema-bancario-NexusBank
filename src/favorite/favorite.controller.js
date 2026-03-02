'use strict';

import Favorite from './favorite.model.js';
import { Account } from '../account/account.model.js';

/**
 * POST /favorites
 * Crear una cuenta favorita
 */
export const createFavorite = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }

        const { accountNumber, accountType, alias } = req.body;

        // Validaciones
        if (!accountNumber || !accountType || !alias) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios: accountNumber, accountType, alias'
            });
        }

        // Validar que la cuenta existe en el sistema
        const existingAccount = await Account.findOne({
            where: { accountNumber: accountNumber.trim() }
        });

        if (!existingAccount) {
            return res.status(404).json({
                success: false,
                message: 'La cuenta ingresada no existe en el sistema',
                accountNumber: accountNumber.trim()
            });
        }

        // Normalizar accountType
        const normalizedType = accountType.toLowerCase().trim();
        const validTypes = ['ahorro', 'corriente', 'savings', 'checking'];
        
        if (!validTypes.includes(normalizedType)) {
            return res.status(400).json({
                success: false,
                message: 'Tipo de cuenta inválido. Debe ser: ahorro, corriente, savings o checking'
            });
        }

        // Verificar si ya existe ese número de cuenta como favorito del usuario
        const existingFavorite = await Favorite.findOne({
            userId,
            accountNumber: accountNumber.trim()
        });

        if (existingFavorite) {
            return res.status(400).json({
                success: false,
                message: 'Esta cuenta ya está en tus favoritos',
                data: {
                    existingAlias: existingFavorite.alias,
                    existingId: existingFavorite._id
                }
            });
        }

        // Crear el favorito
        const newFavorite = await Favorite.create({
            userId,
            accountNumber: accountNumber.trim(),
            accountType: normalizedType,
            alias: alias.trim()
        });

        return res.status(201).json({
            success: true,
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
            return res.status(400).json({
                success: false,
                message: 'Esta cuenta ya está en tus favoritos'
            });
        }

        // Error de validación de Mongoose
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Error de validación',
                errors: messages
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

/**
 * GET /favorites
 * Listar todos los favoritos del usuario autenticado
 */
export const getFavorites = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }

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

        return res.status(200).json({
            success: true,
            message: 'Favoritos obtenidos exitosamente',
            data: {
                favorites,
                total: favorites.length
            }
        });

    } catch (error) {
        console.error('Error obteniendo favoritos:', error);
        return res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

/**
 * GET /favorites/:id
 * Obtener un favorito específico
 */
export const getFavoriteById = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }

        const favorite = await Favorite.findOne({
            _id: id,
            userId
        });

        if (!favorite) {
            return res.status(404).json({
                success: false,
                message: 'Favorito no encontrado o no te pertenece'
            });
        }

        return res.status(200).json({
            success: true,
            data: favorite
        });

    } catch (error) {
        console.error('Error obteniendo favorito:', error);
        return res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

/**
 * PUT /favorites/:id
 * Editar el alias de un favorito existente
 */
export const updateFavorite = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { alias, accountType, isActive } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }

        // Validar que se envió al menos un campo para actualizar
        if (!alias && !accountType && isActive === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar al menos un campo para actualizar: alias, accountType o isActive'
            });
        }

        // Buscar el favorito
        const favorite = await Favorite.findOne({
            _id: id,
            userId
        });

        if (!favorite) {
            return res.status(404).json({
                success: false,
                message: 'Favorito no encontrado o no te pertenece'
            });
        }

        // Actualizar campos
        if (alias) {
            favorite.alias = alias.trim();
        }

        if (accountType) {
            const normalizedType = accountType.toLowerCase().trim();
            const validTypes = ['ahorro', 'corriente', 'savings', 'checking'];
            
            if (!validTypes.includes(normalizedType)) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo de cuenta inválido. Debe ser: ahorro, corriente, savings o checking'
                });
            }
            
            favorite.accountType = normalizedType;
        }

        if (isActive !== undefined) {
            favorite.isActive = Boolean(isActive);
        }

        await favorite.save();

        return res.status(200).json({
            success: true,
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
            return res.status(400).json({
                success: false,
                message: 'Error de validación',
                errors: messages
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

/**
 * DELETE /favorites/:id
 * Eliminar un favorito existente
 */
export const deleteFavorite = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }

        const favorite = await Favorite.findOneAndDelete({
            _id: id,
            userId
        });

        if (!favorite) {
            return res.status(404).json({
                success: false,
                message: 'Favorito no encontrado o no te pertenece'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Favorito eliminado exitosamente',
            data: {
                id: favorite._id,
                alias: favorite.alias,
                accountNumber: favorite.accountNumber
            }
        });

    } catch (error) {
        console.error('Error eliminando favorito:', error);
        return res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};
