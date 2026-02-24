import { DataTypes } from 'sequelize';
import sequelize from '../../../configs/postgres-db.js';

export const UserPasswordReset = sequelize.define('UserPasswordReset', {
    token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'user_password_resets',
    timestamps: true
});
