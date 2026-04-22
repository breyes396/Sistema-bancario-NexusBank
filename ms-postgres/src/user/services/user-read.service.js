import { User, UserProfile } from '../user.model.js';
import { UserRole, Role } from '../../auth/role.model.js';
import { UserEmail } from '../../auth/userEmail.model.js';
import { Account } from '../../account/account.model.js';
import { Transaction } from '../../transaction/transaction.model.js';
import { buildUserListQueryOptions } from './user-query-builder.service.js';

const toLightUser = (userInstance) => {
    const user = userInstance.toJSON();
    return {
        id: user.id,
        email: user.email,
        status: user.status,
        isVerified: user.isVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        role: user.UserRoles?.[0]?.Role?.name || 'Cliente',
        profile: {
            name: user.UserProfile?.Name || null,
            username: user.UserProfile?.Username || null,
            phoneNumber: user.UserProfile?.PhoneNumber || null
        }
    };
};

export const getPaginatedUsersLight = async (rawQuery = {}) => {
    const { pagination, filters } = buildUserListQueryOptions(rawQuery);

    const include = [
        {
            model: UserProfile,
            as: 'UserProfile',
            attributes: ['Name', 'Username', 'PhoneNumber'],
            required: false,
            where: Object.keys(filters.profileWhere).length > 0 ? filters.profileWhere : undefined
        },
        {
            model: UserRole,
            as: 'UserRoles',
            required: filters.role !== null,
            include: [
                {
                    model: Role,
                    as: 'Role',
                    attributes: ['name'],
                    required: filters.role !== null,
                    where: filters.role ? { name: filters.role } : undefined
                }
            ]
        }
    ];

    const { rows, count } = await User.findAndCountAll({
        where: filters.userWhere,
        attributes: ['id', 'email', 'status', 'isVerified', 'lastLogin', 'createdAt'],
        include,
        order: [['createdAt', 'DESC']],
        limit: pagination.limit,
        offset: pagination.offset,
        distinct: true
    });

    return {
        data: rows.map(toLightUser),
        meta: {
            page: pagination.page,
            limit: pagination.limit,
            total: count,
            totalPages: Math.ceil(count / pagination.limit),
            hasNextPage: pagination.offset + rows.length < count,
            hasPrevPage: pagination.page > 1
        }
    };
};

export const getUserDetailHeavyById = async (id) => {
    return User.findByPk(id, {
        attributes: ['id', 'email', 'status', 'isVerified', 'lastLogin', 'createdAt'],
        include: [
            {
                model: UserProfile,
                as: 'UserProfile',
                attributes: ['Name', 'Username', 'PhoneNumber', 'Address', 'JobName', 'DocumentType', 'DocumentNumber', 'Income']
            },
            {
                model: UserEmail,
                as: 'UserEmails',
                attributes: ['email', 'verified']
            },
            {
                model: UserRole,
                as: 'UserRoles',
                include: [
                    {
                        model: Role,
                        as: 'Role',
                        attributes: ['name']
                    }
                ]
            },
            {
                model: Account,
                as: 'Accounts',
                attributes: ['id', 'accountNumber', 'accountType', 'accountBalance', 'status', 'createdAt'],
                include: [
                    {
                        model: Transaction,
                        as: 'Transactions',
                        attributes: ['id', 'type', 'amount', 'description', 'balanceAfter', 'status', 'createdAt'],
                        limit: 10,
                        order: [['createdAt', 'DESC']]
                    }
                ]
            }
        ]
    });
};
