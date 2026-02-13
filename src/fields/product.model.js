'use strict';

import mongoose from "mongoose";

const productSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'El nombre del producto es requerido'],
            trim: true,
            maxLength: [100, 'El nombre no puede exceder 100 caracteres']
        },
        description: {
            type: String,
            required: [true, 'La descripción es requerida'],
            trim: true,
            maxLength: [500, 'La descripción no puede exceder 500 caracteres']
        },
        price: {
            type: Number,
            required: [true, 'El precio es requerido'],
            min: [0, 'El precio debe ser mayor o igual a 0']
        },
        category: {
            type: String,
            required: [true, 'La categoría es requerida'],
            enum: {
                values: ['CUENTAS', 'CREDITOS', 'INVERSIONES', 'SEGUROS', 'TRANSFERENCIAS', 'ASESORAMIENTO'],
                message: 'Categoría no válida. Debe ser: CUENTAS, CREDITOS, INVERSIONES, SEGUROS, TRANSFERENCIAS o ASESORAMIENTO'
            }
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
)

productSchema.index({ isActive: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1, category: 1 });

export default mongoose.model('Product', productSchema);
