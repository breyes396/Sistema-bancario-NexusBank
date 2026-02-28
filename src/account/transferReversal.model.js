'use strict';

import { DataTypes } from 'sequelize';
import sequelize from '../../configs/db.js';
import { generateId } from '../../helpers/uuid-generator.js';

const TransferReversal = sequelize.define(
  'TransferReversal',
  {
    id: {
      type: DataTypes.STRING(16),
      primaryKey: true,
      defaultValue: () => generateId('TREV')
    },
    transferId: {
      type: DataTypes.STRING(16),
      allowNull: false,
      field: 'transfer_id',
      references: {
        model: 'transactions',
        key: 'id'
      }
    },
    sourceAccountId: {
      type: DataTypes.STRING(16),
      allowNull: false,
      field: 'source_account_id',
      references: {
        model: 'accounts',
        key: 'id'
      }
    },
    destinationAccountId: {
      type: DataTypes.STRING(16),
      allowNull: false,
      field: 'destination_account_id',
      references: {
        model: 'accounts',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'amount'
    },
    status: {
      type: DataTypes.ENUM('INICIADA', 'COMPLETADA', 'FALLIDA', 'RECHAZADA'),
      allowNull: false,
      defaultValue: 'INICIADA',
      field: 'status'
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'reason'
    },
    // ID de la transacción compensatoria generada
    compensationTransactionId: {
      type: DataTypes.STRING(16),
      allowNull: true,
      field: 'compensation_transaction_id'
    },
    // Validación de tiempo (5 minutos)
    requestedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'requested_at'
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at'
    },
    // Quién aprobó la reversión
    approvedBy: {
      type: DataTypes.STRING(16),
      allowNull: true,
      field: 'approved_by'
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'approved_at'
    },
    // Prevenir duplicados - hash de identificación única
    reversalHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: 'reversal_hash'
    }
  },
  {
    sequelize,
    tableName: 'transfer_reversals',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['transfer_id']
      },
      {
        fields: ['source_account_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['reversal_hash']
      }
    ]
  }
);

export default TransferReversal;
