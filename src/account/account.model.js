import { DataTypes } from 'sequelize';
import sequelize from '../../configs/db.js';
import { generateAccountId } from '../../helpers/uuid-generator.js';

export const Account = sequelize.define('Account', {
    id: {
        type: DataTypes.STRING(16),
        primaryKey: true,
        defaultValue: () => generateAccountId()
    },
    accountNumber: {
        type: DataTypes.STRING(17),
        allowNull: false,
        unique: true
    },
    accountType: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'ahorro'
    },
    status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    accountBalance: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    perTransactionLimit: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: null
    },
    dailyTransactionLimit: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: null
    },
    openedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
    },
    lastAdminChangeBy: {
        type: DataTypes.STRING(16),
        allowNull: true
    },
    lastAdminChangeAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    lastAdminChangeType: {
        type: DataTypes.STRING,
        allowNull: true
    },
    lastAdminChangeReason: {
        type: DataTypes.STRING,
        allowNull: true
    },
    userId: {
        type: DataTypes.STRING(16),
        allowNull: false
    }
}, {
    tableName: 'accounts',
    timestamps: true
});
