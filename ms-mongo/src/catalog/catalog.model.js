'use strict';

import mongoose from 'mongoose';

/**
 * MODELO CATALOG - PROMOCIONES BANCARIAS (MONGODB)
 * 
 * Almacena promociones, ofertas y servicios exclusivos del banco
 */

const catalogSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => {
        const chars = '123456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
        let id = 'cat_';
        for (let i = 0; i < 12; i++) {
          id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
      }
    },

    name: {
      type: String,
      required: true,
      maxlength: 100,
      trim: true
    },

    description: {
      type: String,
      default: null,
      trim: true
    },

    promotionType: {
      type: String,
      enum: [
        'DEPOSITO_CASHBACK',
        'TRANSFERENCIA_DESCUENTO',
        'TRANSFERENCIA_PROPIA_BONUS',
        'TRANSACCIONES_FRECUENTES',
        'SALDO_MINIMO_REWARD',
        'APERTURA_CUENTA_BONUS'
      ],
      required: true
    },

    minDepositAmount: { type: Number, default: null },
    maxDepositAmount: { type: Number, default: null },
    minTransferAmount: { type: Number, default: null },
    maxTransferAmount: { type: Number, default: null },
    minConsecutiveTransactions: { type: Number, default: null },
    minAccountBalance: { type: Number, default: null },

    discountPercentage: { type: Number, default: null },
    cashbackPercentage: { type: Number, default: null },
    cashbackAmount: { type: Number, default: null },
    bonusPoints: { type: Number, default: null },

    maxUsesPerClient: { type: Number, default: null },
    maxUsesTotalPromotion: { type: Number, default: null },
    usesCountTotal: { type: Number, default: 0 },

    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    daysOfWeekApplicable: { type: [Number], default: null },

    status: {
      type: String,
      enum: ['ACTIVA', 'INACTIVA', 'PAUSADA', 'EXPIRADA'],
      default: 'ACTIVA'
    },

    isExclusive: { type: Boolean, default: false },

    createdBy: { type: String, default: null },
    updatedBy: { type: String, default: null },
    notes: { type: String, default: null }
  },
  {
    _id: true,
    timestamps: true,
    collection: 'catalogs'
  }
);

catalogSchema.index({ status: 1 });
catalogSchema.index({ promotionType: 1 });
catalogSchema.index({ createdAt: -1 });
catalogSchema.index({ name: 'text' });

export const Catalog = mongoose.models.Catalog || mongoose.model('Catalog', catalogSchema);

export default Catalog;
