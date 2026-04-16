import mongoose from 'mongoose';
import { generateAccountLimitAuditId } from '../../helpers/uuid-generator.js';

const accountLimitAuditSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => generateAccountLimitAuditId()
  },
  actorUserId: {
    type: String,
    required: true,
    index: true
  },
  accountId: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: ['LIMITS_VIEW', 'LIMITS_UPDATE'],
    required: true,
    index: true
  },
  outcome: {
    type: String,
    enum: ['SUCCESS', 'DENIED', 'NOT_FOUND', 'ERROR'],
    required: true,
    index: true
  },
  previousPerTransactionLimit: Number,
  newPerTransactionLimit: Number,
  previousDailyTransactionLimit: Number,
  newDailyTransactionLimit: Number,
  previousStatus: Boolean,
  newStatus: Boolean,
  reason: String,
  ipAddress: String,
  userAgent: String,
  metadata: mongoose.Schema.Types.Mixed
}, {
  collection: 'account_limit_audits',
  timestamps: true,
  versionKey: false
});

export const AccountLimitAudit = mongoose.models.AccountLimitAudit || mongoose.model('AccountLimitAudit', accountLimitAuditSchema);
