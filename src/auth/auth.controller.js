import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { 
  User,
  UserProfile,
  UserPasswordReset
} from '../user/user.model.js';
import { UserEmail } from './userEmail.model.js';
import { Role, UserRole } from './role.model.js';
import { Account } from '../account/account.model.js';
import config from '../../configs/config.js';
import sequelize from '../../configs/db.js';
import { generateAccountNumber } from '../../helpers/account-generator.js';
import {
  sendVerificationEmail,
  sendPasswordResetEmail
} from '../../helpers/mailer.js';

const EMAIL_VERIFY_EXPIRES_IN = '24h';
const PASSWORD_RESET_EXPIRES_MINUTES = 60;

const normalizeRole = (roleName) => {
  if (!roleName) return 'Client';
  if (roleName === 'Administrador') return 'Admin';
  if (roleName === 'Empleado') return 'Employee';
  if (roleName === 'Cliente') return 'Client';
  return roleName;
};

const getUserRoleName = async (userId) => {
  const userRole = await UserRole.findOne({ where: { UserId: userId } });
  if (!userRole) return 'Cliente';
  const role = await Role.findByPk(userRole.RoleId);
  return role?.name || 'Cliente';
};

const generateEmailVerificationToken = (userId) => {
  return jwt.sign({ userId, type: 'email-verify' }, config.jwtSecret, {
    expiresIn: EMAIL_VERIFY_EXPIRES_IN
  });
};

const generatePasswordResetToken = () => {
  return crypto
    .randomBytes(32)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

const ensureRole = async (roleName) => {
  const [role] = await Role.findOrCreate({
    where: { name: roleName },
    defaults: { description: `Rol ${roleName}` }
  });
  return role;
};

// Login clientes y administradores
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ msg: 'Email y password son requeridos' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ msg: 'Credenciales invalidas' });
    }

    if (!user.status) {
      return res.status(423).json({ msg: 'Cuenta desactivada' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ msg: 'Credenciales invalidas' });
    }

    const userEmail = await UserEmail.findOne({ where: { userId: user.id } });
    const isVerified = user.isVerified || userEmail?.verified;
    if (!isVerified) {
      return res.status(403).json({
        msg: 'Debes verificar tu email antes de iniciar sesion'
      });
    }

    const roleName = await getUserRoleName(user.id);
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: normalizeRole(roleName)
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: normalizeRole(roleName)
      }
    });
  } catch (err) {
    res.status(500).json({ msg: 'Error en el servidor', error: err.message });
  }
};

export const register = async (req, res) => {
  const {
    email,
    password,
    name,
    fullName,
    username,
    phoneNumber,
    address,
    jobName,
    documentType,
    documentNumber,
    income,
    accountType
  } = req.body;

  if (income !== undefined && income < 100) {
    return res.status(400).json({ 
      msg: 'El ingreso debe ser mayor o igual a 100' 
    });
  }

  const transaction = await sequelize.transaction();

  try {
    const profileName = name || fullName;

    const exists = await User.findOne({ where: { email } });
    if (exists) {
      await transaction.rollback();
      return res.status(409).json({ msg: 'El correo ya esta registrado' });
    }

    const profileConflict = await UserProfile.findOne({
      where: { Username: username }
    });

    if (profileConflict) {
      await transaction.rollback();
      return res.status(409).json({ msg: 'El username ya esta en uso' });
    }

    if (documentNumber) {
      const documentConflict = await UserProfile.findOne({
        where: { DocumentNumber: documentNumber }
      });
      if (documentConflict) {
        await transaction.rollback();
        return res.status(409).json({ msg: 'El documento ya esta registrado' });
      }
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hash,
      status: true,
      isVerified: false
    }, { transaction });

    await UserProfile.create({
      Name: profileName,
      Username: username,
      PhoneNumber: phoneNumber,
      Address: address || 'N/A',
      JobName: jobName || 'N/A',
      DocumentType: documentType || 'DPI',
      DocumentNumber: documentNumber || `${Date.now()}${Math.floor(Math.random() * 10000)}`,
      Income: income || 0,
      Status: true,
      UserId: user.id
    }, { transaction });

    await UserEmail.create({
      userId: user.id,
      email,
      verified: false
    }, { transaction });

    const clientRole = await ensureRole('Cliente');
    await UserRole.create({
      UserId: user.id,
      RoleId: clientRole.id
    }, { transaction });

    const accountNumber = await generateAccountNumber();
    await Account.create({
      accountNumber,
      userId: user.id,
      accountType: accountType || 'ahorro',
      status: true,
      accountBalance: 0
    }, { transaction });

    await transaction.commit();

    const verificationToken = generateEmailVerificationToken(user.id);
    let emailSent = false;

    try {
      await sendVerificationEmail(email, profileName, verificationToken);
      emailSent = true;
    } catch (emailError) {
      console.error('Error enviando email de verificacion:', emailError);
    }

    const response = {
      msg: emailSent
        ? 'Usuario registrado. Revisa tu correo para verificar tu cuenta'
        : 'Usuario registrado, pero no se pudo enviar el correo de verificacion',
      emailSent,
      user: { id: user.id, email: user.email }
    };

    if (!emailSent && process.env.NODE_ENV === 'development') {
      response.devVerificationToken = verificationToken;
      response.devVerifyEndpoint = '/nexusBank/v1/auth/verify-email';
    }

    res.status(201).json(response);
  } catch (err) {
    await transaction.rollback();
    console.error('Error en registro:', err);
    res.status(500).json({ msg: 'Error en el servidor', error: err.message });
  }
};

export const verifyEmail = async (req, res) => {
  const bodyToken = req.body?.token;
  const queryToken = req.query?.token;
  const authHeader = req.headers?.authorization;
  let bearerToken = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    bearerToken = authHeader.substring(7).trim();
  }

  const token = bodyToken || queryToken || bearerToken;

  try {
    if (!token) {
      return res.status(400).json({
        msg: 'Token requerido. Envia token en body.token, query ?token= o Authorization Bearer'
      });
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    if (!decoded || decoded.type !== 'email-verify') {
      return res.status(400).json({ msg: 'Token invalido' });
    }

    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }

    if (user.isVerified) {
      return res.status(400).json({ msg: 'Email ya verificado' });
    }

    user.isVerified = true;
    await user.save();

    const userEmail = await UserEmail.findOne({ where: { userId: user.id } });
    if (userEmail) {
      userEmail.verified = true;
      await userEmail.save();
    }

    res.status(200).json({ msg: 'Email verificado correctamente' });
  } catch (err) {
    res.status(400).json({ msg: 'Token invalido o expirado' });
  }
};

export const resendVerification = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ msg: 'Email requerido' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }

    const userEmail = await UserEmail.findOne({ where: { userId: user.id } });
    const profile = await UserProfile.findOne({ where: { UserId: user.id } });
    const isVerified = user.isVerified || userEmail?.verified;
    if (isVerified) {
      return res.status(400).json({ msg: 'Email ya verificado' });
    }

    const verificationToken = generateEmailVerificationToken(user.id);

    try {
      await sendVerificationEmail(
        email,
        profile?.Name || 'cliente',
        verificationToken
      );
    } catch (emailError) {
      console.error('Error reenviando email de verificacion:', emailError);

      const response = {
        msg: 'No se pudo reenviar el email de verificacion',
        emailSent: false
      };

      if (process.env.NODE_ENV === 'development') {
        response.devError = emailError.message;
        response.devVerificationToken = verificationToken;
        response.devVerifyEndpoint = '/nexusBank/v1/auth/verify-email';
      }

      return res.status(502).json(response);
    }

    res.status(200).json({ msg: 'Email de verificacion reenviado', emailSent: true });
  } catch (err) {
    res.status(500).json({ msg: 'Error en el servidor', error: err.message });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ msg: 'Email requerido' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(200).json({
        msg: 'Si el email existe, se envio un enlace de recuperacion'
      });
    }

    const token = generatePasswordResetToken();
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRES_MINUTES * 60 * 1000);

    const existingReset = await UserPasswordReset.findOne({
      where: { UserId: user.id }
    });

    if (existingReset) {
      existingReset.PasswordResetToken = token;
      existingReset.PasswordResetTokenExpiry = expiresAt;
      await existingReset.save();
    } else {
      await UserPasswordReset.create({
        UserId: user.id,
        PasswordResetToken: token,
        PasswordResetTokenExpiry: expiresAt
      });
    }

    await sendPasswordResetEmail(email, token);

    res.status(200).json({
      msg: 'Si el email existe, se envio un enlace de recuperacion'
    });
  } catch (err) {
    res.status(500).json({ msg: 'Error en el servidor', error: err.message });
  }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    if (!token || !newPassword) {
      return res.status(400).json({ msg: 'Token y password son requeridos' });
    }

    const reset = await UserPasswordReset.findOne({
      where: { PasswordResetToken: token }
    });
    if (!reset) {
      return res.status(400).json({ msg: 'Token invalido' });
    }

    if (reset.PasswordResetTokenExpiry < new Date()) {
      return res.status(400).json({ msg: 'Token expirado' });
    }

    const user = await User.findByPk(reset.UserId);
    if (!user) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    await reset.destroy();

    res.status(200).json({ msg: 'Password actualizado correctamente' });
  } catch (err) {
    res.status(500).json({ msg: 'Error en el servidor', error: err.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ msg: 'Usuario no autenticado' });
    }

    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'status', 'lastLogin', 'isVerified']
    });

    if (!user) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }

    const profile = await UserProfile.findOne({ where: { UserId: userId } });
    const accounts = await Account.findAll({ where: { userId } });

    res.status(200).json({
      user,
      profile,
      accounts
    });
  } catch (err) {
    res.status(500).json({ msg: 'Error en el servidor', error: err.message });
  }
};