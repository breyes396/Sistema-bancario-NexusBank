'use strict';

import { DataTypes } from 'sequelize';
import sequelize from '../../configs/db.js';
import { generateAuditId } from '../../helpers/uuid-generator.js';

/**
 * MODELO CATALOG AUDIT - AUDITORÍA DE CAMBIOS EN PROMOCIONES
 * 
 * Registra todos los cambios realizados en promociones para trazabilidad completa.
 */

export const CatalogAudit = sequelize.define(
  'CatalogAudit',
  {
    id: {
      type: DataTypes.STRING(16),
      primaryKey: true,
      defaultValue: () => generateAuditId(),
      field: 'id'
    },
    catalogId: {
      type: DataTypes.STRING(16),
      allowNull: false,
      field: 'catalog_id',
      references: {
        model: 'catalogs',
        key: 'id'
      }
    },
    action: {
      type: DataTypes.ENUM('CREAR', 'ACTUALIZAR', 'DESACTIVAR', 'PAUSAR', 'REACTIVAR'),
      allowNull: false,
      field: 'action'
    },
    actorUserId: {
      type: DataTypes.STRING(16),
      allowNull: false,
      field: 'actor_user_id'
    },
    previousValues: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
      field: 'previous_values'
    },
    newValues: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
      field: 'new_values'
    },
    changedFields: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
      field: 'changed_fields'
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
      field: 'reason'
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      defaultValue: null,
      field: 'ip_address'
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
      field: 'user_agent'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
      field: 'metadata'
    }
  },
  {
    sequelize,
    tableName: 'catalog_audits',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['catalog_id']
      },
      {
        fields: ['actor_user_id']
      },
      {
        fields: ['action']
      },
      {
        fields: ['created_at']
      }
    ]
  }
);

export default CatalogAudit;
