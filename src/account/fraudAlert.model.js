'use strict';

import { DataTypes } from 'sequelize';
import sequelize from '../../configs/db.js';
import { generateAccountId } from '../../helpers/uuid-generator.js';

export const FraudAlert = sequelize.define('FraudAlert', {
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
        allowNull: true
    },
    alertType: {
        type: DataTypes.STRING,
        allowNull: false,
        enum: [
            'EXCESSIVE_FAILED_ATTEMPTS',
            'RAPID_TRANSACTIONS',
            'UNUSUAL_AMOUNT',
            'UNUSUAL_LOCATION',
            'NEW_RECIPIENT',
            'BLOCKED_ACCOUNT',
            'MULTIPLE_IPS',
            'PATTERN_DETECTED'
        ],
        comment: 'Tipo de alerta de fraude'
    },
    severity: {
        type: DataTypes.STRING,
        allowNull: false,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        defaultValue: 'MEDIUM'
    },
    description: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    failedAttempts: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
        comment: 'Número de intentos fallidos (si aplica)'
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Información adicional de la alerta'
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        enum: ['ACTIVE', 'INVESTIGATED', 'RESOLVED', 'FALSE_POSITIVE'],
        defaultValue: 'ACTIVE'
    },
    actionTaken: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'Acción tomada por el administrador'
    },
    reviewedBy: {
        type: DataTypes.STRING(16),
        allowNull: true,
        comment: 'ID del admin que revisó la alerta'
    },
    reviewedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true,
    updatedAt: false,
    tableName: 'FraudAlerts'
});

export default FraudAlert;
