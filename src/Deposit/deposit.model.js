import { DataTypes } from 'sequelize';
import sequelize from '../../../configs/postgres-db.js';

export const Deposit = sequelize.define('Deposit', {
    fromClientId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    toClientId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    fromAccountNumber: {
        type: DataTypes.STRING,
        allowNull: true
    },
    toAccountNumber: {
        type: DataTypes.STRING,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(12,2),
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'deposit'
    }
}, {
    tableName: 'deposits',
    timestamps: true
});


