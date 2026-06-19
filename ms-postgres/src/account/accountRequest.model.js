import { DataTypes } from 'sequelize';
import sequelize from '../../configs/db.js';
import { generateShortUUID } from '../../helpers/uuid-generator.js';

export const AccountRequest = sequelize.define('AccountRequest', {
    id: {
        type: DataTypes.STRING(16),
        primaryKey: true,
        defaultValue: () => `req_${generateShortUUID().slice(0, 12)}`
    },
    userId: {
        type: DataTypes.STRING(16),
        allowNull: false
    },
    accountType: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'AHORROS, CORRIENTE, etc.'
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
        allowNull: false,
        defaultValue: 'PENDING'
    },
    note: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Motivo de la solicitud'
    },
    createdAccountId: {
        type: DataTypes.STRING(16),
        allowNull: true,
        comment: 'ID de la cuenta creada cuando fue aprobada'
    },
    approvedBy: {
        type: DataTypes.STRING(16),
        allowNull: true,
        comment: 'ID del admin que aprobó'
    },
    approvedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    rejectedBy: {
        type: DataTypes.STRING(16),
        allowNull: true,
        comment: 'ID del admin que rechazó'
    },
    rejectedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Motivo del rechazo'
    }
}, {
    tableName: 'account_requests',
    timestamps: true
});
