import { DataTypes } from 'sequelize';
import sequelize from '../../configs/db.js';
import { generateAuditId } from '../../helpers/uuid-generator.js';

export const SensitiveQueryAudit = sequelize.define('SensitiveQueryAudit', {
  id: {
    type: DataTypes.STRING(16),
    primaryKey: true,
    defaultValue: () => generateAuditId()
  },
  actorUserId: {
    type: DataTypes.STRING(16),
    allowNull: false
  },
  targetUserId: {
    type: DataTypes.STRING(16),
    allowNull: false
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'ADMIN_CLIENT_DETAIL_VIEW'
  },
  outcome: {
    type: DataTypes.ENUM('SUCCESS', 'DENIED', 'NOT_FOUND', 'ERROR'),
    allowNull: false
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'sensitive_query_audits',
  timestamps: true
});
