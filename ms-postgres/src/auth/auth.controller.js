import bcrypt from 'bcryptjs';
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
import { ERROR_CODES } from '../../helpers/error-catalog.js';
import { sendError, sendSuccess } from '../../helpers/response.js';
import {
  normalizeRole,
  getUserRoleName,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  ensureRole
} from '../../services/auth/token.service.js';
import {
  sendVerificationFlowEmail,
  sendPasswordResetFlowEmail
} from '../../services/auth/auth-mail-flow.service.js';
import {
  AUDIT_ACTIONS,
  AUDIT_RESOURCES,
  recordAuditEvent
} from '../../services/audit.service.js';

const PASSWORD_RESET_EXPIRES_MINUTES = 60;

// Login clientes y administradores
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return sendError(res, {
        status: 400,
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Email y password son requeridos'
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      await recordAuditEvent({
        req,
        actorUserId: null,
        action: AUDIT_ACTIONS.LOGIN,
        resource: AUDIT_RESOURCES.AUTH,
        result: 'DENIED',
        beforeState: null,
        afterState: null,
        metadata: { email, reason: 'USER_NOT_FOUND' }
      });

      return sendError(res, {
        status: 400,
        code: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        message: 'Credenciales invalidas'
      });
    }

    if (!user.status) {
      await recordAuditEvent({
        req,
        actorUserId: user.id,
        action: AUDIT_ACTIONS.LOGIN,
        resource: AUDIT_RESOURCES.AUTH,
        result: 'DENIED',
        beforeState: { status: user.status },
        afterState: { status: user.status },
        metadata: { email, reason: 'ACCOUNT_DISABLED' }
      });

      return sendError(res, {
        status: 423,
        code: ERROR_CODES.AUTH_ACCOUNT_DISABLED,
        message: 'Cuenta desactivada'
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      await recordAuditEvent({
        req,
        actorUserId: user.id,
        action: AUDIT_ACTIONS.LOGIN,
        resource: AUDIT_RESOURCES.AUTH,
        result: 'DENIED',
        beforeState: null,
        afterState: null,
        metadata: { email, reason: 'INVALID_PASSWORD' }
      });

      return sendError(res, {
        status: 400,
        code: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        message: 'Credenciales invalidas'
      });
    }

    const userEmail = await UserEmail.findOne({ where: { userId: user.id } });
    const isVerified = user.isVerified || userEmail?.verified;
    if (!isVerified) {
      await recordAuditEvent({
        req,
        actorUserId: user.id,
        action: AUDIT_ACTIONS.LOGIN,
        resource: AUDIT_RESOURCES.AUTH,
        result: 'DENIED',
        beforeState: { isVerified: false },
        afterState: { isVerified: false },
        metadata: { email, reason: 'EMAIL_NOT_VERIFIED' }
      });

      return sendError(res, {
        status: 403,
        code: ERROR_CODES.AUTH_EMAIL_NOT_VERIFIED,
        message: 'Debes verificar tu email antes de iniciar sesion'
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

    await recordAuditEvent({
      req,
      actorUserId: user.id,
      action: AUDIT_ACTIONS.LOGIN,
      resource: AUDIT_RESOURCES.AUTH,
      result: 'SUCCESS',
      beforeState: { lastLogin: null },
      afterState: { lastLogin: user.lastLogin },
      metadata: { email, role: normalizeRole(roleName) }
    });

    return sendSuccess(res, {
      status: 200,
      message: 'Login exitoso',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: normalizeRole(roleName)
        }
      }
    });
  } catch (err) {
    await recordAuditEvent({
      req,
      actorUserId: null,
      action: AUDIT_ACTIONS.LOGIN,
      resource: AUDIT_RESOURCES.AUTH,
      result: 'ERROR',
      metadata: { email, error: err.message }
    });

    return sendError(res, {
      status: 500,
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'Error en el servidor',
      details: err.message
    });
  }
};

// Función auxiliar para generar username automáticamente
const generateUsername = (name) => {
  // Limpiar el nombre: remover espacios, caracteres especiales, y limitar longitud
  const cleanName = name
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 20);
  
  // Generar sufijo numérico de 4 dígitos
  const suffix = Math.floor(1000 + Math.random() * 9000);
  
  return `${cleanName}${suffix}`;
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
    if (!profileName || !phoneNumber) {
      await transaction.rollback();
      return res.status(400).json({ msg: 'Nombre y teléfono son requeridos' });
    }

    const exists = await User.findOne({ where: { email } });
    if (exists) {
      await transaction.rollback();
      return res.status(409).json({ msg: 'El correo ya esta registrado' });
    }

    // Generar username automáticamente si no se proporciona
    let finalUsername = username;
    if (!finalUsername) {
      let attempts = 0;
      let isUnique = false;

      while (!isUnique && attempts < 10) {
        finalUsername = generateUsername(profileName);
        const conflict = await UserProfile.findOne({ where: { Username: finalUsername } });
        isUnique = !conflict;
        attempts++;
      }

      if (!isUnique) {
        await transaction.rollback();
        return res.status(500).json({ msg: 'No se pudo generar un username único. Por favor proporciona uno manualmente.' });
      }
    } else {
      const profileConflict = await UserProfile.findOne({ where: { Username: finalUsername } });
      if (profileConflict) {
        await transaction.rollback();
        return res.status(409).json({ msg: 'El username ya esta en uso' });
      }
    }

    if (documentNumber) {
      const documentConflict = await UserProfile.findOne({ where: { DocumentNumber: documentNumber } });
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
      Username: finalUsername,
      PhoneNumber: phoneNumber,
      Address: address || 'N/A',
      JobName: jobName || 'N/A',
      DocumentType: documentType || 'DPI',
      DocumentNumber: documentNumber || `${Date.now()}${Math.floor(Math.random() * 10000)}`,
      Income: income || 0,
      Status: true,
      UserId: user.id
    }, { transaction });

    await UserEmail.create({ userId: user.id, email, verified: false }, { transaction });

    const clientRole = await ensureRole('Cliente');
    await UserRole.create({ UserId: user.id, RoleId: clientRole.id }, { transaction });

    const accountNumber = await generateAccountNumber(accountType || 'ahorro');
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
      await sendVerificationFlowEmail({ email, profileName, verificationToken });
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

    return res.status(201).json(response);
  } catch (err) {
    await transaction.rollback();
    console.error('Error en registro:', err);
    return res.status(500).json({ msg: 'Error en el servidor', error: err.message });
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
        await sendVerificationFlowEmail({
        email,
        profileName: profile?.Name || 'cliente',
        verificationToken
        });
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

      await sendPasswordResetFlowEmail({ email, token });

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



