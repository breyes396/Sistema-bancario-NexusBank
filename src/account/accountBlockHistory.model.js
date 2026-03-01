import { DataTypes } from 'sequelize';
import sequelize from '../../configs/db.js';
import { generateAccountId } from '../../helpers/uuid-generator.js';

export const AccountBlockHistory = sequelize.define('AccountBlockHistory', {
    id: {
        type: DataTypes.STRING(16),
        primaryKey: true,
        defaultValue: () => generateAccountId()
    },
    accountId: {
        type: DataTypes.STRING(16),
        allowNull: false,
        references: {
            model: 'accounts',
            key: 'id'
        }
    },
    action: {
        type: DataTypes.ENUM(
            'FREEZE',
            'UNFREEZE',
            'SUSPEND',
            'REACTIVATE'
        ),
        allowNull: false
    },
    previousStatus: {
        type: DataTypes.STRING,
        allowNull: true
    },
    newStatus: {
        type: DataTypes.STRING,
        allowNull: false
    },
    reason: {
        type: DataTypes.ENUM(
            'FRAUD_SUSPICION',
            'SECURITY_REVIEW',
            'COMPLIANCE_CHECK',
            'USER_REQUEST',
            'ADMINISTRATIVE_ACTION',
            'SUSPICIOUS_ACTIVITY',
            'RISK_ASSESSMENT',
            'INVESTIGATION',
            'RESOLVED',
            'OTHER'
        ),
        allowNull: false
    },
    reasonDetails: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    performedBy: {
        type: DataTypes.STRING(16),
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    performedByRole: {
        type: DataTypes.STRING,
        allowNull: true
    },
    unblockScheduledFor: {
        type: DataTypes.DATE,
        allowNull: true
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: true
    },
    userAgent: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'account_block_history',
    timestamps: true,
    indexes: [
        {
            fields: ['accountId']
        },
        {
            fields: ['performedBy']
        },
        {
            fields: ['action']
        },
        {
            fields: ['createdAt']
        }
    ]
});
