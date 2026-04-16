import mongoose from 'mongoose';
import { generateFraudAlertId } from '../../helpers/uuid-generator.js';

const fraudAlertSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: () => generateFraudAlertId()
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
    alertType: {
        type: String,
        required: true
    },
    severity: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'MEDIUM',
        index: true
    },
    description: {
        type: String,
        required: true
    },
    failedAttempts: {
        type: Number,
        default: null
    },
    metadata: mongoose.Schema.Types.Mixed,
    status: {
        type: String,
        enum: ['ACTIVE', 'RESOLVED', 'DISMISSED'],
        default: 'ACTIVE',
        index: true
    },
    reviewedBy: {
        type: String,
        default: null
    },
    reviewedAt: {
        type: Date,
        default: null
    }
}, {
    collection: 'fraud_alerts',
    timestamps: true,
    versionKey: false
});

export const FraudAlert = mongoose.models.FraudAlert || mongoose.model('FraudAlert', fraudAlertSchema);
