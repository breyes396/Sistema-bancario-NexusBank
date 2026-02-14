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
            trim: true,
            lowercase: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor proporcione un email válido']
        },
        password: {
            type: String,
            required: [true, 'La contraseña es requerida'],
            minLength: 6,
            select: false
        },
        phone: {
            type: String,
            required: [true, 'El teléfono es requerido'],
            trim: true
        },
        role: {
            type: String,
            enum: {
                values: ['Client', 'Employee', 'Admin'],
                message: 'El rol debe ser Client, Employee o Admin'
            },
            default: 'Client'
        },
        income: {
            type: Number,
            required: [true, 'El ingreso es requerido'],
            min: 0
        },
        accountNumber: {
            type: String,
            unique: true,
            sparse: true
        },
        accountBalance: {
            type: Number,
            default: 0,
            min: 0
        },
        documentType: {
            type: String,
            enum: {
                values: ['CC', 'CE', 'PA'],
                message: 'Tipo de documento inválido. Válidos: CC (Cédula), CE (Cédula Extranjera), PA (Pasaporte)'
            },
            required: [true, 'El tipo de documento es requerido']
        },
        documentNumber: {
            type: String,
            required: [true, 'El número de documento es requerido'],
            unique: true,
            trim: true
        },
        isActive: {
            type: Boolean,
            default: true
        },
        lastLogin: {
            type: Date
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

export default mongoose.model('Client', clientSchema);