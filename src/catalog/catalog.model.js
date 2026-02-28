'use strict';

import { DataTypes } from 'sequelize';
import sequelize from '../../configs/db.js';
import { generateCatalogId } from '../../helpers/uuid-generator.js';

/**
 * MODELO CATALOG - PROMOCIONES BANCARIAS
 * 
 * Este modelo gestiona promociones y ofertas especiales para transacciones bancarias.
 * Las promociones tienen reglas definidas y son auditadas en todos sus cambios.
 */

export const Catalog = sequelize.define(
  'Catalog',
  {
    id: {
      type: DataTypes.STRING(16),
      primaryKey: true,
      defaultValue: () => generateCatalogId(),
      field: 'id'
    },
    // Información General
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'name'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'description'
    },
    
    // Tipo de promoción
    promotionType: {
      type: DataTypes.ENUM(
        'DEPOSITO_CASHBACK',           // Cashback en depósitos
        'TRANSFERENCIA_DESCUENTO',     // Descuento en transferencias
        'TRANSFERENCIA_PROPIA_BONUS',  // Bonus por transferencias entre cuentas propias
        'TRANSACCIONES_FRECUENTES',    // Bonus por N transacciones
        'SALDO_MINIMO_REWARD',         // Rewward por mantener saldo mínimo
        'APERTURA_CUENTA_BONUS'        // Bonus por apertura de cuenta
      ),
      allowNull: false,
      field: 'promotion_type'
    },

    // CONDICIONES - Cuándo aplica la promoción
    minDepositAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: null,
      field: 'min_deposit_amount'
    },
    maxDepositAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: null,
      field: 'max_deposit_amount'
    },
    minTransferAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: null,
      field: 'min_transfer_amount'
    },
    maxTransferAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: null,
      field: 'max_transfer_amount'
    },
    minConsecutiveTransactions: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      field: 'min_consecutive_transactions'
    },
    minAccountBalance: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: null,
      field: 'min_account_balance'
    },

    // BENEFICIOS - Qué ofrece la promoción
    discountPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: null,
      field: 'discount_percentage'
    },
    cashbackAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
      field: 'cashback_amount'
    },
    cashbackPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: null,
      field: 'cashback_percentage'
    },
    bonusPoints: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      field: 'bonus_points'
    },

    // LÍMITES DE USO
    maxUsesPerClient: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      field: 'max_uses_per_client'
    },
    maxUsesTotalPromotion: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      field: 'max_uses_total_promotion'
    },
    usesCountTotal: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'uses_count_total'
    },

    // PERÍODOS DE VALIDEZ
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      defaultValue: null,
      field: 'start_date'
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      defaultValue: null,
      field: 'end_date'
    },
    daysOfWeekApplicable: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
      field: 'days_of_week_applicable'
    },

    // ESTADO
    status: {
      type: DataTypes.ENUM('ACTIVA', 'INACTIVA', 'PAUSADA', 'EXPIRADA'),
      allowNull: false,
      defaultValue: 'ACTIVA',
      field: 'status'
    },
    isExclusive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_exclusive'
    },

    // AUDITORÍA
    createdBy: {
      type: DataTypes.STRING(16),
      allowNull: false,
      field: 'created_by'
    },
    updatedBy: {
      type: DataTypes.STRING(16),
      allowNull: true,
      defaultValue: null,
      field: 'updated_by'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
      field: 'notes'
    }
  },
  {
    sequelize,
    tableName: 'catalogs',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['status']
      },
      {
        fields: ['promotion_type']
      },
      {
        fields: ['start_date', 'end_date']
      },
      {
        fields: ['created_by']
      }
    ]
  }
);

export default Catalog;
