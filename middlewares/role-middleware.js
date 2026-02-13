'use strict';

import jwt from 'jsonwebtoken';

export const verifyTokenAndGetUser = (req, res, next) => {
    try {
        const token = req.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token no disponible'
            });
        }

        const decoded = jwt.decode(token);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }

        req.user = {
            id: decoded.id || decoded._id,
            email: decoded.email,
            role: decoded.role,
            name: decoded.name
        };

        next();
    } catch (error) {
        console.error('Error al verificar token:', error);
        return res.status(401).json({
            success: false,
            message: 'Error al verificar el token'
        });
    }
};

export const verifyIsAdmin = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }

        if (req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Se requiere rol de Administrador'
            });
        }

        next();
    } catch (error) {
        console.error('Error al verificar rol de Admin:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar los permisos'
        });
    }
};

export const verifyIsClient = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }

        if (req.user.role !== 'Client') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Se requiere rol de Cliente'
            });
        }

        next();
    } catch (error) {
        console.error('Error al verificar rol de Client:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar los permisos'
        });
    }
};

export const verifyRoles = (allowedRoles = []) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: `Acceso denegado. Roles permitidos: ${allowedRoles.join(', ')}`
                });
            }

            next();
        } catch (error) {
            console.error('Error al verificar roles:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al verificar los permisos'
            });
        }
    };
};
