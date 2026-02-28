'use strict';

import { DataTypes } from 'sequelize';
import sequelize from '../../configs/db.js';
import { generateCatalogId } from '../../helpers/uuid-generator.js';

const Catalog = sequelize.define(
  'Catalog',
  {
    id: {
      type: DataTypes.STRING(16),
      primaryKey: true,
      defaultValue: () => generateCatalogId()
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'name'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'description'
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'price',
      comment: 'Precio en moneda (Q) para referencia'
    },
    pointsCost: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'points_cost',
      comment: 'Puntos necesarios para canjear este premio'
    },
    category: {
      type: DataTypes.ENUM(
        'TECNOLOGIA',
        'ELECTRODOMESTICOS',
        'VIAJES',
        'ENTRETENIMIENTO',
        'GASTRONOMIA',
        'SALUD_Y_BELLEZA',
        'MODA',
        'HOGAR',
        'EDUCACION',
        'DEPORTES'
      ),
      allowNull: false,
      defaultValue: 'TECNOLOGIA',
      field: 'category'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'image_url'
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      field: 'stock',
      comment: 'Cantidad disponible. NULL = ilimitado'
    }
  },
  {
    sequelize,
    tableName: 'catalogs',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['category']
      },
      {
        fields: ['is_active']
      }
    ]
  }
);

export { Catalog };
