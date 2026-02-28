'use strict';

import { DataTypes } from 'sequelize';
import sequelize from '../../configs/db.js';
import { generateAccountId } from '../../helpers/uuid-generator.js';

export const FailedTransaction = sequelize.define('FailedTransaction', {
    id: {
        type: DataTypes.STRING(16),
        primaryKey: true,
        defaultValue: () => generateAccountId()
    },
    userId: {
        type: DataTypes.STRING(16),
        allowNull: false,
        index: true
    },
    accountId: {
        type: DataTypes.STRING(16),
        allowNull: true,
        index: true
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,
        enum: ['TRANSFER', 'DEPOSIT', 'WITHDRAWAL'],
        comment: 'Tipo de operación que falló'
    },
    amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    failureReason: {
        type: DataTypes.STRING(500),
        allowNull: false,
        comment: 'Razón del fallo'
    },
    ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
        comment: 'IP del cliente'
    },
    userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'User-Agent del navegador'
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Información adicional del intento fallido'
    },
    isBlocked: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Si el usuario fue bloqueado después de este intento'
    },
    blockedUntil: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Hasta cuándo está bloqueado el usuario'
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true,
    updatedAt: false,
    tableName: 'FailedTransactions'
});

export default FailedTransaction;
