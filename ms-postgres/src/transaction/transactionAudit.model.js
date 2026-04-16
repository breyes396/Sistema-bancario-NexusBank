'use strict';

import mongoose from 'mongoose';
import { generateAuditId } from '../../helpers/uuid-generator.js';

const transactionAuditSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: () => generateAuditId()
    },
    transactionId: {
        type: String,
        required: true,
        index: true
    },
    actorUserId: {
        type: String,
        required: true,
        index: true
    },
    action: {
        type: String,
        enum: ['REVERT_ATTEMPT', 'REVERT_SUCCESS', 'REVERT_DENIED', 'STATUS_CHANGE', 'ADMIN_MODIFICATION'],
        required: true,
        index: true
    },
    outcome: {
        type: String,
        enum: ['SUCCESS', 'DENIED', 'ERROR'],
        required: true,
        index: true
    },
    previousStatus: {
        type: String,
        default: null
    },
    newStatus: {
        type: String,
        default: null
    },
    revertedAmount: {
        type: Number,
        default: null
    },
    relatedCouponId: {
        type: String,
        default: null
    },
    reason: {
        type: String,
        default: null
    },
    timeElapsedSeconds: {
        type: Number,
        default: null
    },
    ipAddress: {
        type: String,
        default: null
    },
    userAgent: {
        type: String,
        default: null
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    }
}, {
    collection: 'transaction_audits',
    timestamps: true,
    versionKey: false
});

export const TransactionAudit = mongoose.models.TransactionAudit || mongoose.model('TransactionAudit', transactionAuditSchema);
