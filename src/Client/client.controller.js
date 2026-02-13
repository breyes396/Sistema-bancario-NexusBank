'use strict';

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Client from './client.model.js';
import { generateAccountNumber } from '../../helpers/account-generator.js';

export const registerClient = async (req, res) => {
    try {
        const { income, password } = req.body;

        if (income < 100) {
            return res.status(400).json({
                success: false,
                message: 'El ingreso debe ser mayor o igual a 100'
            });
        }

        const accountNumber = await generateAccountNumber();

        const hashedPassword = await bcrypt.hash(password, 10);

        const client = new Client({
            ...req.body,
            password: hashedPassword,
            accountNumber
        });

        await client.save();

        const clientResponse = client.toObject();
        delete clientResponse.password;

        res.status(201).json({
            success: true,
            message: 'Cliente registrado exitosamente',
            data: clientResponse
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al registrar cliente',
            error: error.message
        });
    }
};

export const loginClient = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }

        const client = await Client.findOne({ email: email.toLowerCase() }).select('+password');

        if (!client) {
            return res.status(401).json({
                success: false,
                message: 'Email o contraseña incorrectos'
            });
        }

        if (!client.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Usuario inactivo o bloqueado'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, client.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Email o contraseña incorrectos'
            });
        }

        await Client.updateOne({ _id: client._id }, { lastLogin: new Date() });

        const token = jwt.sign(
            {
                id: client._id,
                email: client.email,
                name: client.name,
                role: client.role
            },
            process.env.JWT_SECRET || 'nexusbank-secret-key',
            { expiresIn: '24h' }
        );

        const clientData = {
            id: client._id,
            name: client.name,
            email: client.email,
            phone: client.phone,
            role: client.role,
            income: client.income,
            accountNumber: client.accountNumber,
            accountBalance: client.accountBalance,
            documentType: client.documentType,
            documentNumber: client.documentNumber,
            isActive: client.isActive
        };

        res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso',
            token,
            data: clientData
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión',
            error: error.message
        });
    }
};