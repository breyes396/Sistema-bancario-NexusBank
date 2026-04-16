'use strict';

import mongoose from 'mongoose';

/**
 * MODELO FAVORITE - CUENTAS FAVORITAS (MONGODB)
 * 
 * Almacena cuentas favoritas de los usuarios para agilizar transferencias
 */

const favoriteSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => {
        const chars = '123456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
        let id = 'fav_';
        for (let i = 0; i < 12; i++) {
          id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
      }
    },

    userId: {
      type: String,
      required: [true, 'El ID del usuario es obligatorio'],
      index: true,
      match: [/^usr_[A-Za-z0-9]{12}$/, 'Formato de userId inválido']
    },

    accountNumber: {
      type: String,
      required: [true, 'El número de cuenta es obligatorio'],
      trim: true,
      maxlength: [20, 'El número de cuenta no puede exceder 20 caracteres']
    },

    accountType: {
      type: String,
      required: [true, 'El tipo de cuenta es obligatorio'],
      enum: ['ahorro', 'corriente', 'Savings', 'Checking'],
      trim: true,
      lowercase: true
    },

    alias: {
      type: String,
      required: [true, 'El alias es obligatorio'],
      trim: true,
      minlength: [2, 'El alias debe tener al menos 2 caracteres'],
      maxlength: [50, 'El alias no puede exceder 50 caracteres']
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    collection: 'favorites'
  }
);

// Índice compuesto para evitar duplicados de la misma cuenta por usuario
favoriteSchema.index({ userId: 1, accountNumber: 1 }, { unique: true });

// Índice para búsquedas por alias
favoriteSchema.index({ userId: 1, alias: 1 });

// Índice para búsquedas activas
favoriteSchema.index({ userId: 1, isActive: 1 });

const Favorite = mongoose.model('Favorite', favoriteSchema);

export default Favorite;
