'use strict';

import mongoose from 'mongoose';

const transactionSchema = mongoose.Schema(
    {
        emisor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
            description: 'ID del usuario emisor (puede ser nulo en depósitos de Admin)'
        },
        receptor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'El usuario receptor es obligatorio']
        },
        monto: {
            type: Number,
            required: [true, 'El monto es obligatorio'],
            min: [0.01, 'El monto mínimo debe ser 0.01']
        },
        tipo: {
            type: String,
            enum: {
                values: ['Depósito', 'Transferencia', 'Compra'],
                message: 'El tipo debe ser: Depósito, Transferencia o Compra'
            },
            required: [true, 'El tipo de transacción es obligatorio']
        },
        fecha: {
            type: Date,
            default: Date.now
        },
        estado: {
            type: String,
            enum: {
                values: ['Completado', 'Revertido', 'Fallido'],
                message: 'El estado debe ser: Completado, Revertido o Fallido'
            },
            required: [true, 'El estado es obligatorio']
        },
        descripcion: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Índices para optimización de búsquedas
transactionSchema.index({ emisor: 1 });
transactionSchema.index({ receptor: 1 });
transactionSchema.index({ tipo: 1 });
transactionSchema.index({ estado: 1 });
transactionSchema.index({ fecha: -1 });
transactionSchema.index({ emisor: 1, receptor: 1, fecha: -1 });

export default mongoose.model('Transaction', transactionSchema);
