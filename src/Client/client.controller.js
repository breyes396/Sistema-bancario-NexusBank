'use strict';

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, Account, Role, UserProfile, Admin, UserEmail } from '../db/models/index.js';
import sequelize from '../../configs/postgres-db.js';
import { generateAccountNumber } from '../../helpers/account-generator.js';
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail, sendPasswordChangedEmail } from '../../services/email.service.js';

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

        // 1. Create User (Auth data) - Initially INACTIVE until email verification
        const user = await User.create({
            email,
            password: hashedPassword,
            status: false,
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

        // 5. Generate verification token (JWT)
        const verificationToken = jwt.sign(
            { userId: user.id, email: user.email, type: 'email_verification' },
            process.env.JWT_SECRET,
            { expiresIn: `${process.env.VERIFICATION_EMAIL_EXPIRY_HOURS || 24}h` }
        );

        // 6. Save verification token
        await UserEmail.create({
            userId: user.id,
            email: user.email,
            verificationToken,
            isVerified: false
        }, { transaction: t });

        await t.commit();

        // 7. Send verification email (async, don't wait)
        sendVerificationEmail(email, name, verificationToken).catch(err => {
            console.error('Error enviando email de verificación:', err);
        });

        const userResponse = user.toJSON();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            message: 'Cliente registrado exitosamente. Revisa tu correo para verificar tu cuenta.',
            data: { 
                email: user.email, 
                name, 
                accountNumber,
                verificationRequired: true
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

// ===== EMAIL VERIFICATION ENDPOINTS =====

export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token de verificación requerido'
            });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.type !== 'email_verification') {
            return res.status(400).json({
                success: false,
                message: 'Token inválido'
            });
        }

        const userEmail = await UserEmail.findOne({ 
            where: { 
                userId: decoded.userId,
                verificationToken: token,
                isVerified: false
            }
        });

        if (!userEmail) {
            return res.status(400).json({
                success: false,
                message: 'Token inválido o ya fue usado'
            });
        }

        const t = await sequelize.transaction();

        try {
            // Activate user
            await User.update(
                { status: true },
                { where: { id: decoded.userId }, transaction: t }
            );

            // Mark email as verified
            await userEmail.update({ isVerified: true }, { transaction: t });

            await t.commit();

            // Get user data
            const user = await User.findByPk(decoded.userId, {
                include: [
                    { model: UserProfile, as: 'profile' },
                    { model: Account, as: 'account' }
                ]
            });

            // Send welcome email
            if (user && user.profile && user.account) {
                sendWelcomeEmail(
                    user.email, 
                    user.profile.name, 
                    user.account.accountNumber
                ).catch(err => {
                    console.error('Error enviando email de bienvenida:', err);
                });
            }

            return res.status(200).json({
                success: true,
                message: '¡Email verificado exitosamente! Tu cuenta está ahora activa.'
            });

        } catch (error) {
            await t.rollback();
            throw error;
        }

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({
                success: false,
                message: 'El token de verificación ha expirado. Solicita uno nuevo.'
            });
        }
        console.error('Error al verificar email:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar email',
            error: error.message
        });
    }
};

export const resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email requerido'
            });
        }

        const user = await User.findOne({ 
            where: { email },
            include: [
                { model: UserProfile, as: 'profile' },
                { model: UserEmail, as: 'emails' }
            ]
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        if (user.status) {
            return res.status(400).json({
                success: false,
                message: 'Esta cuenta ya está verificada'
            });
        }

        // Generate new token
        const verificationToken = jwt.sign(
            { userId: user.id, email: user.email, type: 'email_verification' },
            process.env.JWT_SECRET,
            { expiresIn: `${process.env.VERIFICATION_EMAIL_EXPIRY_HOURS || 24}h` }
        );

        // Update or create UserEmail record
        const [userEmail] = await UserEmail.findOrCreate({
            where: { userId: user.id },
            defaults: {
                email: user.email,
                verificationToken,
                isVerified: false
            }
        });

        if (userEmail) {
            await userEmail.update({ 
                verificationToken,
                isVerified: false 
            });
        }

        // Send email
        await sendVerificationEmail(
            user.email, 
            user.profile?.name || 'Usuario', 
            verificationToken
        );

        return res.status(200).json({
            success: true,
            message: 'Email de verificación reenviado exitosamente'
        });

    } catch (error) {
        console.error('Error al reenviar email:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al reenviar email',
            error: error.message
        });
    }
};

export const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email requerido'
            });
        }

        const user = await User.findOne({ 
            where: { email },
            include: [{ model: UserProfile, as: 'profile' }]
        });

        if (!user) {
            // Don't reveal if user exists
            return res.status(200).json({
                success: true,
                message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
            });
        }

        // Generate reset token
        const resetToken = jwt.sign(
            { userId: user.id, email: user.email, type: 'password_reset' },
            process.env.JWT_SECRET,
            { expiresIn: `${process.env.PASSWORD_RESET_EXPIRY_HOURS || 1}h` }
        );

        // Send email
        await sendPasswordResetEmail(
            user.email, 
            user.profile?.name || 'Usuario', 
            resetToken
        );

        return res.status(200).json({
            success: true,
            message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
        });

    } catch (error) {
        console.error('Error al solicitar reset de contraseña:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al procesar solicitud',
            error: error.message
        });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token y nueva contraseña requeridos'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.type !== 'password_reset') {
            return res.status(400).json({
                success: false,
                message: 'Token inválido'
            });
        }

        const user = await User.findByPk(decoded.userId, {
            include: [{ model: UserProfile, as: 'profile' }]
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await user.update({ password: hashedPassword });

        // Send confirmation email
        sendPasswordChangedEmail(
            user.email,
            user.profile?.name || 'Usuario'
        ).catch(err => {
            console.error('Error enviando email de confirmación:', err);
        });

        return res.status(200).json({
            success: true,
            message: 'Contraseña restablecida exitosamente'
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({
                success: false,
                message: 'El token ha expirado. Solicita un nuevo restablecimiento de contraseña.'
            });
        }
        console.error('Error al restablecer contraseña:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al restablecer contraseña',
            error: error.message
        });
    }
};