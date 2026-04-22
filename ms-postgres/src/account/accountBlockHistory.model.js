import mongoose from 'mongoose';
import { generateAuditId } from '../../helpers/uuid-generator.js';

const accountBlockHistorySchema = new mongoose.Schema({
    _id: {
        type: String,
        default: () => generateAuditId()
    },
    accountId: {
        type: String,
        required: true,
        index: true
    },
    action: {
        type: String,
        enum: ['FREEZE', 'UNFREEZE', 'SUSPEND', 'REACTIVATE'],
        required: true,
        index: true
    },
    previousStatus: String,
    newStatus: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        enum: [
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
        ],
        required: true
    },
    reasonDetails: String,
    performedBy: {
        type: String,
        required: true,
        index: true
    },
    performedByRole: String,
    unblockScheduledFor: Date,
    ipAddress: String,
    userAgent: String
}, {
    collection: 'account_block_history',
    timestamps: true,
    versionKey: false
});

export const AccountBlockHistory = mongoose.models.AccountBlockHistory || mongoose.model('AccountBlockHistory', accountBlockHistorySchema);
