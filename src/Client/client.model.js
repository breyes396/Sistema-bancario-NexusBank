'use strict';

import mongoose from 'mongoose';

const clientSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'El nombre es requerido'],
            trim: true,
            maxLength: 100
        },
        email: {
            type: String,
            required: [true, 'El correo es requerido'],
            unique: true,
            trim: true
        },
        income: {
            type: Number,
            required: [true, 'El ingreso es requerido'],
            min: 0
        },
        accountNumber: {
            type: String,
            unique: true
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
);

export default mongoose.model('Client', clientSchema);