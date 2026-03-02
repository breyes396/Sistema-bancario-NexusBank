import { DataTypes } from 'sequelize';
import sequelize from '../../configs/db.js';
import { generateAccountLimitAuditId } from '../../helpers/uuid-generator.js';

export const AccountLimitAudit = sequelize.define('AccountLimitAudit', {
  id: {
    type: DataTypes.STRING(16),
    primaryKey: true,
    defaultValue: () => generateAccountLimitAuditId()
  },
  actorUserId: {
    type: DataTypes.STRING(16),
    allowNull: false
  },
  accountId: {
    type: DataTypes.STRING(16),
    allowNull: false
  },
  action: {
    type: DataTypes.ENUM('LIMITS_VIEW', 'LIMITS_UPDATE'),
    allowNull: false
  },
  outcome: {
    type: DataTypes.ENUM('SUCCESS', 'DENIED', 'NOT_FOUND', 'ERROR'),
    allowNull: false
  },
  previousPerTransactionLimit: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  newPerTransactionLimit: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  previousDailyTransactionLimit: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  newDailyTransactionLimit: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  previousStatus: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  },
  newStatus: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: true
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
  tableName: 'account_limit_audits',
  timestamps: true
});
