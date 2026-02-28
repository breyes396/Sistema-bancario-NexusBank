'use strict';

import { DataTypes } from 'sequelize';
import sequelize from '../../configs/db.js';
import { generateAuditId } from '../../helpers/uuid-generator.js';

/**
 * MODELO TRANSACTION AUDIT - AUDITORÍA DE TRANSACCIONES
 * 
 * Registra eventos críticos sobre transacciones:
 * - Intentos de reversión (exitosos o fallidos)
 * - Cambios de estado
 * - Acciones administrativas
 * 
 * Propósito:
 * Proveer trazabilidad completa de todas las operaciones
 * realizadas sobre transacciones, especialmente reversiones.
 */

export const TransactionAudit = sequelize.define('TransactionAudit', {
  id: {
    type: DataTypes.STRING(16),
    primaryKey: true,
    defaultValue: () => generateAuditId(),
    field: 'id'
  },
  
  // ID de la transacción auditada
  transactionId: {
    type: DataTypes.STRING(16),
    allowNull: false,
    field: 'transaction_id',
    references: {
      model: 'transactions',
      key: 'id'
    }
  },
  
  // Usuario que realizó la acción
  actorUserId: {
    type: DataTypes.STRING(16),
    allowNull: false,
    field: 'actor_user_id'
  },
  
  // Tipo de acción realizada
  action: {
    type: DataTypes.ENUM(
      'REVERT_ATTEMPT',      // Intento de reversión
      'REVERT_SUCCESS',      // Reversión exitosa
      'REVERT_DENIED',       // Reversión denegada (fuera de tiempo)
      'STATUS_CHANGE',       // Cambio de estado
      'ADMIN_MODIFICATION'   // Modificación administrativa
    ),
    allowNull: false,
    field: 'action'
  },
  
  // Resultado de la acción
  outcome: {
    type: DataTypes.ENUM('SUCCESS', 'DENIED', 'ERROR'),
    allowNull: false,
    field: 'outcome'
  },
  
  // Estado anterior de la transacción
  previousStatus: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'previous_status'
  },
  
  // Nuevo estado de la transacción
  newStatus: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'new_status'
  },
  
  // Monto revertido (si aplica)
  revertedAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    field: 'reverted_amount'
  },
  
  // ID del cupón si la transacción tenía uno aplicado
  relatedCouponId: {
    type: DataTypes.STRING(16),
    allowNull: true,
    field: 'related_coupon_id'
  },
  
  // Razón de la acción
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'reason'
  },
  
  // Tiempo transcurrido desde la transacción (en segundos)
  timeElapsedSeconds: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'time_elapsed_seconds'
  },
  
  // Dirección IP del actor
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
    field: 'ip_address'
  },
  
  // User Agent del navegador
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'user_agent'
  },
  
  // Datos adicionales en formato JSON
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'metadata'
  }
}, {
  tableName: 'transaction_audits',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      // Buscar auditorías de una transacción específica
      fields: ['transaction_id']
    },
    {
      // Buscar acciones de un usuario específico
      fields: ['actor_user_id']
    },
    {
      // Filtrar por tipo de acción
      fields: ['action']
    },
    {
      // Filtrar por resultado
      fields: ['outcome']
    },
    {
      // Ordenar cronológicamente
      fields: ['created_at']
    }
  ]
});
