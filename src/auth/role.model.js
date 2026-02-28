import { DataTypes } from 'sequelize';
import sequelize from '../../configs/db.js';
import { generateRoleId } from '../../helpers/uuid-generator.js';

export const Role = sequelize.define('Role', {
    id: {
        type: DataTypes.STRING(16),
        primaryKey: true,
        defaultValue: () => generateRoleId()
    },
    name: {
        type: DataTypes.ENUM('Administrador', 'Cliente', 'Empleado'),
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'roles',
    timestamps: true
});

export const UserRole = sequelize.define('UserRole', {
    Id: {
        type: DataTypes.STRING(16),
        primaryKey: true,
        field: 'id',
        defaultValue: () => generateRoleId()
    },
    UserId: {
        type: DataTypes.STRING(16),
        allowNull: false,
        field: 'userId'
    },
    RoleId: {
        type: DataTypes.STRING(16),
        allowNull: false,
        field: 'roleId'
    }
}, {
    tableName: 'user_roles',
    timestamps: true
});
