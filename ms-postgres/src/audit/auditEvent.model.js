import { DataTypes } from 'sequelize';
import sequelize from '../../configs/db.js';
import { generateAuditId } from '../../helpers/uuid-generator.js';

export const AuditEvent = sequelize.define('AuditEvent', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        defaultValue: () => generateAuditId()
    },
    actorUserId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    action: {
        type: DataTypes.STRING,
        allowNull: false
    },
    resource: {
        type: DataTypes.STRING,
        allowNull: false
    },
    result: {
        type: DataTypes.STRING,
        allowNull: false
    },
    beforeState: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    afterState: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: true
    },
    userAgent: {
        type: DataTypes.STRING,
        allowNull: true
    },
    metadata: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'audit_events',
    timestamps: true,
    indexes: [
        { fields: ['actorUserId'] },
        { fields: ['action'] },
        { fields: ['resource'] },
        { fields: ['result'] },
        { fields: ['timestamp'] }
    ]
});
