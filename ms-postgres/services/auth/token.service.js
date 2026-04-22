import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import config from '../../configs/config.js';
import { Role, UserRole } from '../../src/auth/role.model.js';

const EMAIL_VERIFY_EXPIRES_IN = '24h';

export const normalizeRole = (roleName) => {
    if (!roleName) return 'Client';
    if (roleName === 'Administrador') return 'Admin';
    if (roleName === 'Empleado') return 'Employee';
    if (roleName === 'Cliente') return 'Client';
    return roleName;
};

export const getUserRoleName = async (userId) => {
    const userRole = await UserRole.findOne({ where: { UserId: userId } });
    if (!userRole) return 'Cliente';
    const role = await Role.findByPk(userRole.RoleId);
    return role?.name || 'Cliente';
};

export const generateEmailVerificationToken = (userId) => {
    return jwt.sign({ userId, type: 'email-verify' }, config.jwtSecret, {
        expiresIn: EMAIL_VERIFY_EXPIRES_IN
    });
};

export const generatePasswordResetToken = () => {
    return crypto
        .randomBytes(32)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
};

export const ensureRole = async (roleName) => {
    const [role] = await Role.findOrCreate({
        where: { name: roleName },
        defaults: { description: `Rol ${roleName}` }
    });
    return role;
};
