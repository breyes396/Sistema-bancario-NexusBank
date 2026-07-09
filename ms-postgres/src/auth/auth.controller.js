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
import { AccountRequest } from '../account/accountRequest.model.js';
import config from '../../configs/config.js';
import { uploadBufferToCloudinary } from '../../configs/cloudinary.js';
import { Op } from 'sequelize';
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
  sendAccountBlockedEmail,
  sendFraudAlertEmail
} from '../../services/email.service.js';
import notificationService from '../../services/notification.service.js';
import {
  AUDIT_ACTIONS,
  AUDIT_RESOURCES,
  recordAuditEvent
} from '../../services/audit.service.js';

const PASSWORD_RESET_EXPIRES_MINUTES = 60;

const buildAccessTokenPayload = (user, role) => ({
  id: user.id,
  email: user.email,
  role: normalizeRole(role)
});

const createAccessToken = (user, role) => jwt.sign(
  buildAccessTokenPayload(user, role),
  config.jwtSecret,
  { expiresIn: config.jwtExpiresIn }
);

const createRefreshToken = (user, role) => jwt.sign(
  {
    ...buildAccessTokenPayload(user, role),
    type: 'refresh'
  },
  config.jwtRefreshSecret,
  { expiresIn: config.jwtRefreshExpiresIn }
);

const getTokenExpirationIso = (token) => {
  const decoded = jwt.decode(token);
  if (!decoded?.exp) return null;
  return new Date(decoded.exp * 1000).toISOString();
};

const createAuthSessionPayload = (user, role) => {
  const token = createAccessToken(user, role);
  const refreshToken = createRefreshToken(user, role);

  return {
    token,
    refreshToken,
    expiresAt: getTokenExpirationIso(token),
    refreshExpiresAt: getTokenExpirationIso(refreshToken)
  };
};

export const login = async (req, res) => {
  const { email, password, emailOrUsername } = req.body;
  try {
    if ((!email && !emailOrUsername) || !password) {
      return sendError(res, {
        status: 400,
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Email/Usuario y password son requeridos'
      });
    }

    let user = null;
    const identifier = (emailOrUsername || email || '').trim();

    if (typeof identifier === 'string' && identifier.includes('@')) {
      // it's an email
      user = await User.findOne({ 
        where: { email: identifier },
        include: [{ model: UserProfile, as: 'UserProfile' }]
      });
    } else {
      // treat as username -> find profile then user (case-insensitive)
      const profile = await UserProfile.findOne({
        where: { Username: { [Op.iLike]: identifier } }
      });
      if (profile) {
        user = await User.findByPk(profile.UserId, {
          include: [{ model: UserProfile, as: 'UserProfile' }]
        });
      }
    }
    
    if (user) {
      console.log(`[AUTH] Usuario encontrado: ${user.id}, intentos previos: ${user.failedLoginAttempts}`);
    }

    if (!user) {
      await recordAuditEvent({
        req,
        actorUserId: null,
        action: AUDIT_ACTIONS.LOGIN,
        resource: AUDIT_RESOURCES.AUTH,
        result: 'DENIED',
        beforeState: null,
        afterState: null,
        metadata: { identifier, reason: 'USER_NOT_FOUND' }
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

    if (user.lockUntil && user.lockUntil > new Date()) {
      return sendError(res, {
        status: 423,
        code: 'AUTH_ACCOUNT_LOCKED',
        message: 'Demasiados intentos fallidos. Intenta nuevamente en 1 minuto.'
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      // Incrementar intentos fallidos
      const currentAttempts = (user.failedLoginAttempts || 0) + 1;
      const remainingAttempts = 3 - currentAttempts;
      
      let message = `Contraseña incorrecta. Te queda${remainingAttempts === 1 ? '' : 'n'} ${remainingAttempts} intento${remainingAttempts === 1 ? '' : 's'}.`;
      let lockUntil = null;

      if (currentAttempts === 2) {
        // Alerta preventiva por múltiples intentos (2)
        console.log(`[AUTH] Enviando alerta por 2 intentos fallidos para usuario: ${user.id}`);
        await notificationService.sendFraudAlert(user.id, {
          title: 'Aviso de Seguridad: Intentos de Acceso',
          message: 'Se han detectado 2 intentos fallidos de inicio de sesión en tu cuenta. Si no fuiste tú, por favor protege tu cuenta.',
          emailType: 'FRAUD',
          emailData: {
            alertType: 'FAILED_LOGIN_ATTEMPTS',
            severity: 'LOW',
            description: 'Dos intentos fallidos consecutivos de inicio de sesión.',
            detectedAt: new Date()
          }
        });
      }

      if (currentAttempts >= 3) {
        lockUntil = new Date(Date.now() + 60 * 1000); // Bloqueo por 1 minuto
        message = 'Demasiados intentos fallidos. Intenta nuevamente en 1 minuto.';
        
        console.log(`[AUTH] Bloqueando usuario ${user.id} por 1 minuto`);
        // Notificación centralizada (App + Email)
        await notificationService.sendFraudAlert(user.id, {
          title: 'Cuenta Bloqueada Temporalmente',
          message: 'Tu cuenta ha sido bloqueada tras 3 intentos fallidos de inicio de sesión.',
          emailType: 'BLOCK',
          emailData: {
            blockedUntil: lockUntil,
            failedAttempts: 3,
            reason: 'Múltiples intentos fallidos de inicio de sesión'
          }
        });
      }
      
      // Actualizar instancia y guardar
      user.failedLoginAttempts = currentAttempts >= 3 ? 0 : currentAttempts;
      user.lockUntil = lockUntil;
      await user.save();
      console.log(`[AUTH] Usuario ${user.id} actualizado: intentos=${user.failedLoginAttempts}, bloqueadoHasta=${user.lockUntil}`);

      await recordAuditEvent({
        req,
        actorUserId: user.id,
        action: AUDIT_ACTIONS.LOGIN,
        resource: AUDIT_RESOURCES.AUTH,
        result: 'DENIED',
        beforeState: null,
        afterState: { failedAttempts: currentAttempts, lockUntil: lockUntil },
        metadata: { email, reason: 'INVALID_PASSWORD' }
      });

      return sendError(res, {
        status: 400,
        code: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        message
      });
    }
    
    // If login is successful, reset attempts and lock
    if (user.failedLoginAttempts > 0 || user.lockUntil) {
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      // No necesitamos save() aquí porque se hace más abajo con lastLogin
    }

    const userEmail = await UserEmail.findOne({ where: { userId: user.id } });
    const isVerified = user.isVerified || userEmail?.verified;
    const roleName = await getUserRoleName(user.id);
    const normalizedRole = normalizeRole(roleName);

    // SOLO validar aprobación y verificación si el usuario es CLIENTE
    if (normalizedRole === 'Client') {
      // Validar que está aprobado
      if (!user.isApproved) {
        await recordAuditEvent({
          req,
          actorUserId: user.id,
          action: AUDIT_ACTIONS.LOGIN,
          resource: AUDIT_RESOURCES.AUTH,
          result: 'DENIED',
          beforeState: { isApproved: false },
          afterState: { isApproved: false },
          metadata: { email, reason: 'ACCOUNT_NOT_APPROVED' }
        });

        return sendError(res, {
          status: 403,
          code: 'AUTH_ACCOUNT_NOT_APPROVED',
          message: 'Tu cuenta está pendiente de aprobación del administrador'
        });
      }

      // Validar que está verificado
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
    }

    // Los admins y otros roles NO necesitan aprobación ni verificación
    
    const authSession = createAuthSessionPayload(user, roleName);

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

    // Recuperar el perfil completo incluyendo la foto
    const profile = await UserProfile.findOne({ 
      where: { UserId: user.id },
      raw: false
    });

    const photoUrl = profile && profile.ProfilePhotoUrl ? profile.ProfilePhotoUrl : null;

    return sendSuccess(res, {
      status: 200,
      message: 'Login exitoso',
      data: {
        token: authSession.token,
        refreshToken: authSession.refreshToken,
        expiresAt: authSession.expiresAt,
        refreshExpiresAt: authSession.refreshExpiresAt,
        user: {
          id: user.id,
          email: user.email,
          name: profile?.Name || profile?.Username || 'Usuario',
          username: profile?.Username || 'Usuario',
          profilePhotoUrl: photoUrl,
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

export const refreshSession = async (req, res) => {
  try {
    const incomingRefreshToken = req.body?.refreshToken;

    if (!incomingRefreshToken) {
      return sendError(res, {
        status: 400,
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'refreshToken es requerido'
      });
    }

    let decoded = null;
    try {
      decoded = jwt.verify(incomingRefreshToken, config.jwtRefreshSecret);
    } catch (_error) {
      return sendError(res, {
        status: 401,
        code: ERROR_CODES.AUTH_REQUIRED,
        message: 'Refresh token invalido o expirado'
      });
    }

    if (!decoded?.id || decoded?.type !== 'refresh') {
      return sendError(res, {
        status: 401,
        code: ERROR_CODES.AUTH_REQUIRED,
        message: 'Refresh token invalido'
      });
    }

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return sendError(res, {
        status: 404,
        code: ERROR_CODES.NOT_FOUND,
        message: 'Usuario no encontrado'
      });
    }

    if (!user.status) {
      return sendError(res, {
        status: 423,
        code: ERROR_CODES.AUTH_ACCOUNT_DISABLED,
        message: 'Cuenta desactivada'
      });
    }

    const roleName = await getUserRoleName(user.id);
    const authSession = createAuthSessionPayload(user, roleName);

    return sendSuccess(res, {
      status: 200,
      message: 'Sesion refrescada exitosamente',
      data: {
        token: authSession.token,
        refreshToken: authSession.refreshToken,
        expiresAt: authSession.expiresAt,
        refreshExpiresAt: authSession.refreshExpiresAt
      }
    });
  } catch (err) {
    return sendError(res, {
      status: 500,
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'Error en el servidor',
      details: err.message
    });
  }
};

const generateUsername = (name) => {
  
  const cleanName = name
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 20);
  
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
  const isAdmin = !!req.user; // If req.user exists, the request came through the /admin/register route with a valid token

  try {
    const profileName = name || fullName;
    if (!profileName || !phoneNumber) {
      await transaction.rollback();
      return res.status(400).json({ msg: 'Nombre y teléfono son requeridos' });
    }

    const exists = await User.findOne({ where: { email } });
    const existsEmail = await UserEmail.findOne({ where: { email } });
    if (exists || existsEmail) {
      await transaction.rollback();
      return res.status(409).json({ msg: 'El correo ya esta registrado' });
    }

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

    // En lugar de crear la cuenta directamente, crear una solicitud de cuenta
    // para que el administrador la revise y apruebe.
    await AccountRequest.create({
      userId: user.id,
      accountType: accountType || 'ahorro',
      status: 'PENDING'
    }, { transaction });

    await transaction.commit();

    // Enviar notificación por email informando que la solicitud fue recibida
    try {
      const profile = await UserProfile.findOne({ where: { UserId: user.id } });
      const contact = { email: user.email, name: profile?.Name || profile?.Username || user.email };
      // Reusar flujo de correo para solicitud recibida
      await notificationService.sendFraudAlert(user.id, { title: 'Solicitud recibida', message: 'Tu solicitud de apertura de cuenta fue recibida y está pendiente de aprobación.' }).catch(() => {});
    } catch (emailErr) {
      console.error('Error enviando notificación de registro:', emailErr && emailErr.message ? emailErr.message : emailErr);
    }

    const response = {
      msg: 'Usuario registrado. Tu solicitud de apertura de cuenta quedó pendiente de aprobación administrativa.',
      emailSent: false,
      user: { id: user.id, email: user.email }
    };

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
        response.devVerifyEndpoint = '/api/v1/auth/verify-email';
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

    const profile = await UserProfile.findOne({ 
      where: { UserId: userId },
      attributes: { include: ['ProfilePhotoUrl'] }
    });
    const accounts = await Account.findAll({ where: { userId } });

    res.status(200).json({
      success: true,
      message: 'Perfil obtenido exitosamente',
      profile: profile || {},
      user,
      accounts
    });
  } catch (err) {
    res.status(500).json({ msg: 'Error en el servidor', error: err.message });
  }
};

export const uploadProfilePhotoController = async (req, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) {
			return res.status(401).json({ msg: 'Usuario no autenticado' });
		}

		if (!req.file) {
			return res.status(400).json({ msg: 'No se ha proporcionado ningún archivo' });
		}

		const user = await User.findByPk(userId, {
			include: [{ model: UserProfile, as: 'UserProfile' }]
		});

		if (!user || !user.UserProfile) {
			return res.status(404).json({ msg: 'Perfil de usuario no encontrado' });
		}

    const folder = process.env.CLOUDINARY_FOLDER || 'nexusbank/profiles';
    const publicId = `profile_${userId}_${Date.now()}`;
    const uploadResult = await uploadBufferToCloudinary(req.file.buffer, {
      folder,
      public_id: publicId,
      resource_type: 'image'
    });
    const photoUrl = uploadResult?.secure_url || uploadResult?.url || null;

    if (!photoUrl) {
      return res.status(500).json({ msg: 'No se pudo obtener la URL de la imagen' });
    }

		// Actualizar el perfil con la nueva foto
		await user.UserProfile.update({ ProfilePhotoUrl: photoUrl });

		// Recargar el perfil para obtener los datos actualizados
		await user.reload({ include: [{ model: UserProfile, as: 'UserProfile' }] });

		return res.status(200).json({
			success: true,
			message: 'Foto de perfil actualizada exitosamente',
			data: { 
				photoUrl: user.UserProfile.ProfilePhotoUrl || photoUrl
			}
		});
	} catch (err) {
		console.error('Error al subir foto de perfil:', err);
		return res.status(500).json({
			msg: 'Error al subir la foto de perfil',
			error: err.message
		});
	}
};



