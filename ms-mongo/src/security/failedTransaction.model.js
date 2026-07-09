import mongoose from 'mongoose';
import { generateFailedTransactionId } from '../../helpers/uuid-generator.js';

const failedTransactionSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: () => generateFailedTransactionId()
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    accountId: {
        type: String,
        default: null,
        index: true
    },
    type: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        default: null
    },
    failureReason: {
        type: String,
        required: true
    },
    ipAddress: String,
    userAgent: String,
    metadata: mongoose.Schema.Types.Mixed,
    isBlocked: {
        type: Boolean,
        default: false,
        index: true
    },
    blockedUntil: {
        type: Date,
        default: null
    }
}, {
    collection: 'failed_transactions',
    timestamps: true,
    versionKey: false
});

export const FailedTransaction = mongoose.models.FailedTransaction || mongoose.model('FailedTransaction', failedTransactionSchema);
