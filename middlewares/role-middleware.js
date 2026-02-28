'use strict';

import jwt from 'jsonwebtoken';
import { Role, UserRole } from '../src/auth/role.model.js';

const normalizeRole = (role) => {
    if (!role) return role;

    const roleValue = String(role).trim().toLowerCase();

    if (roleValue === 'administrador' || roleValue === 'admin') return 'Admin';
    if (roleValue === 'empleado' || roleValue === 'employee') return 'Employee';
    if (roleValue === 'cliente' || roleValue === 'client') return 'Client';

    return String(role).trim();
};

const resolveRoleFromDb = async (userId) => {
    if (!userId) return null;

    const userRole = await UserRole.findOne({ where: { UserId: userId } });
    if (!userRole) return null;

    const role = await Role.findByPk(userRole.RoleId);
    if (!role?.name) return null;

    return normalizeRole(role.name);
};

export const verifyTokenAndGetUser = (req, res, next) => {
    try {
        let token = req.token;

        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader) {
                const [scheme, credentials] = authHeader.split(' ');
                if (scheme === 'Bearer' && credentials) {
                    token = credentials;
                }
            }
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token no disponible'
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: 'JWT_SECRET no configurado en el servidor'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const payload = (decoded && decoded.user) ? decoded.user : decoded;

        if (!payload) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }

        req.user = {
            id: payload.id,
            email: payload.email,
            role: normalizeRole(payload.role),
            name: payload.name
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

        if (normalizeRole(req.user.role) !== 'Admin') {
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

export const verifyIsEmployee = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }

        if (normalizeRole(req.user.role) !== 'Employee') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Se requiere rol de Empleado'
            });
        }

        next();
    } catch (error) {
        console.error('Error al verificar rol de Employee:', error);
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

        if (normalizeRole(req.user.role) !== 'Client') {
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
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            let normalizedRole = normalizeRole(req.user.role);
            if (!normalizedRole) {
                normalizedRole = await resolveRoleFromDb(req.user.id);
                if (normalizedRole) {
                    req.user.role = normalizedRole;
                }
            }

            const normalizedAllowed = allowedRoles.map(normalizeRole);
            if (!normalizedAllowed.includes(normalizedRole)) {
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
