'use strict';

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Client from './client.model.js';
import { generateAccountNumber } from '../../helpers/account-generator.js';

/**
 * Endpoint publico para que el cliente se auto-registre (deprecado)
 * @deprecated Usar employeeCreateClient en su lugar
 */
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

/**
 * Empleado crea una cuenta de cliente
 * @param {Object} req - Solicitud HTTP con datos del cliente
 * @param {Object} res - Respuesta HTTP
 */
export const employeeCreateClient = async (req, res) => {
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
            accountNumber,
            role: 'Client' // Fuerza el rol a Client
        });

        await client.save();

        const clientResponse = client.toObject();
        delete clientResponse.password;

        res.status(201).json({
            success: true,
            message: 'Cliente creado exitosamente por empleado',
            data: clientResponse
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al crear cliente',
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


export const getAllClients = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'Admin') {
            return res.status(403).json({ success: false, message: 'Acceso denegado' });
        }

        const clients = await Client.find({ role: 'Client' }).select('name email accountNumber accountBalance isActive');

        return res.status(200).json({ success: true, data: clients });
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        return res.status(500).json({ success: false, message: 'Error interno', error: error.message });
    }
};


export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        
        if (req.user.role !== 'Admin' && String(req.user.id) !== String(id)) {
            return res.status(403).json({ success: false, message: 'Acceso denegado' });
        }

        
        if (Object.prototype.hasOwnProperty.call(req.body, 'password') || Object.prototype.hasOwnProperty.call(req.body, 'documentNumber')) {
            return res.status(400).json({ success: false, message: 'No está permitido actualizar DPI ni Contraseña' });
        }

        const allowedUpdates = { ...req.body };

        const updated = await Client.findByIdAndUpdate(id, allowedUpdates, { new: true }).select('-password');

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        return res.status(200).json({ success: true, data: updated });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        return res.status(500).json({ success: false, message: 'Error interno', error: error.message });
    }
};


export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.user || req.user.role !== 'Admin') {
            return res.status(403).json({ success: false, message: 'Acceso denegado' });
        }

        const target = await Client.findById(id).select('role');
        if (!target) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        if (target.role === 'Admin') {
            return res.status(403).json({ success: false, message: 'No se permite eliminar a otro Admin' });
        }

        await Client.findByIdAndDelete(id);

        return res.status(200).json({ success: true, message: 'Usuario eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        return res.status(500).json({ success: false, message: 'Error interno', error: error.message });
    }
};