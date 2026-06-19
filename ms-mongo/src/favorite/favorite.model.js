'use strict';

import mongoose from 'mongoose';

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

favoriteSchema.index({ userId: 1, accountNumber: 1 }, { unique: true });

favoriteSchema.index({ userId: 1, alias: 1 });

favoriteSchema.index({ userId: 1, isActive: 1 });

const Favorite = mongoose.model('Favorite', favoriteSchema);

export default Favorite;
