import { DataTypes } from 'sequelize';
import sequelize from '../../../configs/postgres-db.js';

export const User = sequelize.define('User', {
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    lastLogin: {
        type: DataTypes.DATE
    },
    saldo: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.00
    }
}, {
    tableName: 'users',
    timestamps: true
});

// export default User;