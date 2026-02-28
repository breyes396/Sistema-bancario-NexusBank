'use strict';

import mongoose from 'mongoose';

/**
 * MODELO CATALOG AUDIT - AUDITORÍA DE CAMBIOS (MONGODB)
 */

const catalogAuditSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => {
        const chars = '123456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
        let id = 'aud_';
        for (let i = 0; i < 12; i++) {
          id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
      }
    },

    catalogId: {
      type: String,
      required: true,
      index: true
    },

    action: {
      type: String,
      enum: ['CREAR', 'ACTUALIZAR', 'DESACTIVAR', 'PAUSAR', 'REACTIVAR'],
      required: true
    },

    actorUserId: {
      type: String,
      required: true,
      index: true
    },

    previousValues: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },

    newValues: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },

    changedFields: {
      type: [String],
      default: null
    },

    reason: {
      type: String,
      default: null
    },

    ipAddress: {
      type: String,
      maxlength: 45,
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
  },
  {
    _id: true,
    timestamps: true,
    collection: 'catalog_audits'
  }
);

catalogAuditSchema.index({ action: 1 });
catalogAuditSchema.index({ createdAt: -1 });

export const CatalogAudit = mongoose.models.CatalogAudit || mongoose.model('CatalogAudit', catalogAuditSchema);

export default CatalogAudit;
