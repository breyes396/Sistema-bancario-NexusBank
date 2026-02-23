import { DataTypes } from 'sequelize';
import sequelize from '../../../configs/postgres-db.js';

export const UserRole = sequelize.define('UserRole', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    roleId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'user_roles',
    timestamps: true
});
