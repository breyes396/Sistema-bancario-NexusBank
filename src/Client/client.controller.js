'use strict';

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, Account, Role, UserProfile, Admin } from '../db/models/index.js';
import sequelize from '../../configs/postgres-db.js';
import { generateAccountNumber } from '../../helpers/account-generator.js';

export const registerClient = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { income, password, name, email, phone, documentType, documentNumber } = req.body;

        if (income < 100) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'El ingreso debe ser mayor o igual a 100'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const accountNumber = await generateAccountNumber();

        // 1. Create User (Auth data)
        const user = await User.create({
            email,
            password: hashedPassword,
            status: true,
            lastLogin: null
        }, { transaction: t });

        // 2. Create Profile (Personal data)
        await UserProfile.create({
            userId: user.id,
            name,
            phoneNumber: phone,
            documentType,
            documentNumber,
            income,
            status: true
        }, { transaction: t });

        // 3. Assign Role (Client)
        // Find existing role or create if not exists (should exist via seeder usually)
        const [clientRole] = await Role.findOrCreate({
            where: { name: 'Client' },
            defaults: { description: 'Standard bank client' },
            transaction: t
        });
        await user.addRole(clientRole, { transaction: t });

        // 4. Create Account
        await Account.create({
            accountNumber,
            userId: user.id
        }, { transaction: t });

        await t.commit();

        const userResponse = user.toJSON();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            message: 'Cliente registrado exitosamente',
            data: { 
                email: user.email, 
                name, 
                accountNumber 
            }
        });

    } catch (error) {
        await t.rollback();
        res.status(500).json({
            success: false,
            message: 'Error al registrar cliente',
            error: error.message
        });
    }
};

export const employeeCreateClient = async (req, res) => {
    // Reusing register logic for now, but usually employee endpoint has more privileges
    return registerClient(req, res);
};

export const loginClient = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase();

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }

        // 1. Try to find in User (Clients)
        let user = await User.findOne({ 
            where: { email: normalizedEmail },
            include: [
                { model: Account, as: 'account' },
                { model: Role, as: 'roles' },
                { model: UserProfile, as: 'profile' }
            ]
        });

        // 2. If not user, try find in Admin
        let isAdmin = false;
        if (!user) {
            // Try admin table
            user = await Admin.findOne({
                where: { email: email.toLowerCase() },
                include: [{ model: Role, as: 'roles' }]
            });
            if (user) isAdmin = true;
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email o contraseña incorrectos'
            });
        }

        if (!user.status) {
            return res.status(401).json({
                success: false,
                message: 'Usuario inactivo o bloqueado'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Email o contraseña incorrectos'
            });
        }

        user.lastLogin = new Date();
        await user.save();

        const roles = user.roles && user.roles.length > 0 ? user.roles.map(r => r.name) : (isAdmin ? ['Admin'] : ['Client']);
        
        let mainRole = 'Client';
        if (roles.includes('Admin')) mainRole = 'Admin';
        else if (roles.includes('Employee')) mainRole = 'Employee';

        // Payload compatible with existing middleware
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                name: isAdmin ? user.name : (user.profile ? user.profile.name : 'Unknown'),
                role: mainRole,
                isAdmin: isAdmin // Flag to help distinguish in future
            },
            process.env.JWT_SECRET || 'nexusbank-secret-key',
            { expiresIn: '24h' }
        );

        const userData = {
            id: user.id,
            name: isAdmin ? user.name : (user.profile ? user.profile.name : ''),
            email: user.email,
            phone: isAdmin ? user.phone : (user.profile ? user.profile.phoneNumber : ''),
            roles: roles,
            // Client specific fields
            income: (!isAdmin && user.profile) ? user.profile.income : 0,
            accountNumber: (!isAdmin && user.account) ? user.account.accountNumber : null,
            accountBalance: (!isAdmin && user.account) ? user.account.accountBalance : null,
            documentType: (!isAdmin && user.profile) ? user.profile.documentType : '',
            documentNumber: (!isAdmin && user.profile) ? user.profile.documentNumber : '',
            isActive: user.status,
            isAdmin: isAdmin
        };

        res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso',
            token,
            data: userData
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
        const users = await User.findAll({
            include: [
                { model: Account, as: 'account', attributes: ['accountNumber', 'accountBalance'] },
                { model: UserProfile, as: 'profile' },
                { model: Role, as: 'roles' }
            ]
        });

        return res.status(200).json({ success: true, data: users });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        return res.status(500).json({ success: false, message: 'Error interno', error: error.message });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Simplified for brevity - assumes req.user populated by middleware
        if (!req.user) {
             return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }
        
        // Find user first
        const user = await User.findByPk(id, { include: ['profile'] });
        if (!user) {
             return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        // Only updating profile info here
        if (req.body.name || req.body.phone) {
            if (user.profile) {
                await user.profile.update({
                    name: req.body.name || user.profile.name,
                    phoneNumber: req.body.phone || user.profile.phoneNumber
                });
            }
        }
        
        // Reload to get fresh data
        await user.reload();

        return res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        return res.status(500).json({ success: false, message: 'Error interno', error: error.message });
    }
};

export const deleteUser = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;

        const user = await User.findByPk(id, { include: ['roles'] });
        if (!user) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const isAdmin = user.roles && user.roles.some(r => r.name === 'Admin');

        if (isAdmin) {
            await t.rollback();
            return res.status(403).json({ success: false, message: 'No se permite eliminar a otro Admin' });
        }

        // Delete related data first
        await Account.destroy({ where: { userId: id }, transaction: t });
        await UserProfile.destroy({ where: { userId: id }, transaction: t });
        
        // Association cleanup
        if (user.setRoles) {
            await user.setRoles([], { transaction: t }); 
        }

        await User.destroy({ where: { id }, transaction: t });
        
        await t.commit();

        return res.status(200).json({ success: true, message: 'Usuario eliminado correctamente' });
    } catch (error) {
        if (t) await t.rollback();
        console.error('Error al eliminar usuario:', error);
        return res.status(500).json({ success: false, message: 'Error interno', error: error.message });
    }
};