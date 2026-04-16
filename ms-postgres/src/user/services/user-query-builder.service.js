import { Op } from 'sequelize';

const normalizeBoolean = (value) => {
    if (value === undefined || value === null || value === '') return null;
    const normalized = String(value).trim().toLowerCase();
    if (['true', '1', 'yes', 'si'].includes(normalized)) return true;
    if (['false', '0', 'no'].includes(normalized)) return false;
    return null;
};

const normalizeRoleName = (roleValue) => {
    if (!roleValue) return null;
    const normalized = String(roleValue).trim().toLowerCase();
    if (normalized === 'admin' || normalized === 'administrador') return 'Administrador';
    if (normalized === 'employee' || normalized === 'empleado') return 'Empleado';
    if (normalized === 'client' || normalized === 'cliente') return 'Cliente';
    return null;
};

export const buildUserListQueryOptions = (query = {}) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const search = String(query.search || '').trim();
    const role = normalizeRoleName(query.role);
    const status = normalizeBoolean(query.status);
    const verified = normalizeBoolean(query.verified);

    const createdAt = {};
    if (query.from) {
        const fromDate = new Date(query.from);
        if (!Number.isNaN(fromDate.getTime())) {
            createdAt[Op.gte] = fromDate;
        }
    }
    if (query.to) {
        const toDate = new Date(query.to);
        if (!Number.isNaN(toDate.getTime())) {
            createdAt[Op.lte] = toDate;
        }
    }

    const userWhere = {};
    if (status !== null) userWhere.status = status;
    if (verified !== null) userWhere.isVerified = verified;
    if (Object.keys(createdAt).length > 0) userWhere.createdAt = createdAt;

    const profileWhere = {};
    if (search) {
        profileWhere[Op.or] = [
            { Name: { [Op.iLike]: `%${search}%` } },
            { Username: { [Op.iLike]: `%${search}%` } }
        ];
        userWhere[Op.or] = [
            { email: { [Op.iLike]: `%${search}%` } }
        ];
    }

    return {
        pagination: { page, limit, offset },
        filters: {
            role,
            userWhere,
            profileWhere,
            search
        }
    };
};
