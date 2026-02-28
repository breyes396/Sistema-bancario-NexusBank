'use strict';

import { DataTypes } from 'sequelize';
import sequelize from '../../configs/db.js';
import { generateTransactionId } from '../../helpers/uuid-generator.js';

const Transaction = sequelize.define(
  'Transaction',
  {
    id: {
      type: DataTypes.STRING(16),
      primaryKey: true,
      defaultValue: () => generateTransactionId()
    },
    accountId: {
      type: DataTypes.STRING(16),
      allowNull: false,
      field: 'account_id',
      references: {
        model: 'accounts',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('DEPOSITO', 'RETIRO', 'TRANSFERENCIA_ENVIADA', 'TRANSFERENCIA_RECIBIDA', 'COMPRA'),
      allowNull: false,
      field: 'type'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'amount'
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'description'
    },
    balanceAfter: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'balance_after'
    },
    relatedAccountId: {
      type: DataTypes.STRING(16),
      allowNull: true,
      field: 'related_account_id'
    },
    status: {
      type: DataTypes.ENUM('COMPLETADA', 'PENDIENTE', 'FALLIDA'),
      allowNull: false,
      defaultValue: 'COMPLETADA',
      field: 'status'
    }
  },
  {
    sequelize,
    tableName: 'transactions',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['account_id']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['type']
      }
    ]
  }
);

export { Transaction };
