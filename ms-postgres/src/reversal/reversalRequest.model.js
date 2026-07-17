import { DataTypes } from 'sequelize';
import sequelize from '../../configs/db.js';
import { generateShortUUID } from '../../helpers/uuid-generator.js';

export const ReversalRequest = sequelize.define('ReversalRequest', {
    id: {
        type: DataTypes.STRING(16),
        primaryKey: true,
        defaultValue: () => `rv_${generateShortUUID().slice(0, 12)}`
    },
    userId: {
        type: DataTypes.STRING(16),
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('TRANSFERENCIA', 'DEPOSITO'),
        allowNull: false
    },
    operationId: {
        type: DataTypes.STRING(16),
        allowNull: false,
        comment: 'ID de la Transaction original que se solicita revertir'
    },
    reference: {
        type: DataTypes.STRING(32),
        allowNull: true
    },
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true
    },
    accountNumber: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    sourceAccountNumber: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    destinationAccountNumber: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    operationDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    operationDescription: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Motivo ingresado por el cliente'
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
        allowNull: false,
        defaultValue: 'PENDING'
    },
    resolvedBy: {
        type: DataTypes.STRING(16),
        allowNull: true,
        comment: 'ID del admin que aprobó/rechazó'
    },
    resolvedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    adminComment: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'reversal_requests',
    timestamps: true
});
