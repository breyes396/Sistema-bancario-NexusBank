'use strict';

import { Op } from 'sequelize';
import { User, UserProfile } from './user.model.js';
import { UserEmail } from '../auth/userEmail.model.js';
import { Role, UserRole } from '../auth/role.model.js';
import { Account } from '../account/account.model.js';
import { Transaction } from '../account/transaction.model.js';
import { SensitiveQueryAudit } from './sensitiveAudit.model.js';

const createSensitiveAudit = async ({ req, actorUserId, targetUserId, outcome, metadata = {} }) => {
  try {
    await SensitiveQueryAudit.create({
      actorUserId,
      targetUserId,
      action: 'ADMIN_CLIENT_DETAIL_VIEW',
      outcome,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || null,
      metadata
    });
  } catch (auditError) {
    console.error('Error al registrar auditoria sensible:', auditError.message);
  }
};

const maskEmail = (email) => {
  if (!email || typeof email !== 'string') return email;
  const [localPart = '', domainPart = ''] = email.split('@');
  if (!domainPart) return '***';

  const safeLocal = localPart.length <= 2
    ? `${localPart.charAt(0) || '*'}***`
    : `${localPart.slice(0, 2)}***`;

  const [domainName = '', domainTld = ''] = domainPart.split('.');
  const safeDomain = domainName
    ? `${domainName.charAt(0)}***`
    : '***';

  return `${safeLocal}@${safeDomain}${domainTld ? `.${domainTld}` : ''}`;
};

const maskDocumentNumber = (documentNumber) => {
  if (!documentNumber || typeof documentNumber !== 'string') return documentNumber;
  const cleanValue = documentNumber.replace(/\s+/g, '');
  if (cleanValue.length <= 4) return '****';
  return `${'*'.repeat(Math.max(0, cleanValue.length - 4))}${cleanValue.slice(-4)}`;
};

const maskPhoneNumber = (phoneNumber) => {
  if (!phoneNumber || typeof phoneNumber !== 'string') return phoneNumber;
  const cleanValue = phoneNumber.replace(/\D/g, '');
  if (cleanValue.length <= 3) return '***';
  return `${'*'.repeat(Math.max(0, cleanValue.length - 3))}${cleanValue.slice(-3)}`;
};

const maskAddress = (address) => {
  if (!address || typeof address !== 'string') return address;
  const trimmedAddress = address.trim();
  if (trimmedAddress.length <= 6) return '***';
  return `${trimmedAddress.slice(0, 6)}***`;
};

const maskProfileForAdminView = (profile) => {
  if (!profile) return profile;

  return {
    ...profile,
    PhoneNumber: maskPhoneNumber(profile.PhoneNumber),
    Address: maskAddress(profile.Address),
    DocumentNumber: maskDocumentNumber(profile.DocumentNumber),
    Income: profile.Income !== null && profile.Income !== undefined ? 'CONFIDENCIAL' : profile.Income
  };
};

const applyAdminExposureRules = (userData) => {
  if (!userData) return userData;

  const plainUser = typeof userData.toJSON === 'function' ? userData.toJSON() : { ...userData };

  return {
    ...plainUser,
    email: maskEmail(plainUser.email),
    UserProfile: maskProfileForAdminView(plainUser.UserProfile),
    profile: maskProfileForAdminView(plainUser.profile),
    UserEmails: Array.isArray(plainUser.UserEmails)
      ? plainUser.UserEmails.map((item) => ({
          ...item,
          email: maskEmail(item.email)
        }))
      : plainUser.UserEmails,
    userEmails: Array.isArray(plainUser.userEmails)
      ? plainUser.userEmails.map((item) => ({
          ...item,
          email: maskEmail(item.email)
        }))
      : plainUser.userEmails
  };
};

const maskProfileForEmployeeView = (profile) => {
  if (!profile) return profile;

  return {
    ...profile,
    PhoneNumber: maskPhoneNumber(profile.PhoneNumber),
    DocumentNumber: maskDocumentNumber(profile.DocumentNumber),
    Income: profile.Income !== null && profile.Income !== undefined ? 'RESTRINGIDO' : profile.Income
  };
};

const applyEmployeeExposureRules = (userData) => {
  if (!userData) return userData;

  const plainUser = typeof userData.toJSON === 'function' ? userData.toJSON() : { ...userData };

  return {
    ...plainUser,
    UserProfile: maskProfileForEmployeeView(plainUser.UserProfile),
    profile: maskProfileForEmployeeView(plainUser.profile)
  };
};

const maskProfileForClientView = (profile) => {
  if (!profile) return profile;

  return {
    ...profile,
    PhoneNumber: maskPhoneNumber(profile.PhoneNumber),
    Address: maskAddress(profile.Address),
    DocumentNumber: maskDocumentNumber(profile.DocumentNumber),
    Income: '***'
  };
};

const applyClientExposureRules = (userData, accessorUserId) => {
  if (!userData) return userData;

  const plainUser = typeof userData.toJSON === 'function' ? userData.toJSON() : { ...userData };
  
  // Si el Client está viendo sus propios datos, no enmascarar
  if (plainUser.id === accessorUserId) {
    return plainUser;
  }

  // Si está viendo datos de otro usuario, enmascarar todo
  return {
    ...plainUser,
    email: maskEmail(plainUser.email),
    UserProfile: maskProfileForClientView(plainUser.UserProfile),
    profile: maskProfileForClientView(plainUser.profile),
    UserEmails: Array.isArray(plainUser.UserEmails)
      ? plainUser.UserEmails.map((item) => ({
          ...item,
          email: maskEmail(item.email)
        }))
      : plainUser.UserEmails,
    userEmails: Array.isArray(plainUser.userEmails)
      ? plainUser.userEmails.map((item) => ({
          ...item,
          email: maskEmail(item.email)
        }))
      : plainUser.userEmails
  };
};

/**
 * Aplica reglas de exposición de datos sensibles según el rol del usuario que accede
 * @param {Object} userData - Datos del usuario a exponer
 * @param {String} accessorRole - Rol del usuario que accede (Admin, Employee, Client)
 * @param {String} accessorUserId - ID del usuario que accede (para validar si es propio)
 * @returns {Object} - Datos con máscaras aplicadas según rol
 */
const applyExposureRulesByRole = (userData, accessorRole, accessorUserId = null) => {
  if (!userData) return userData;

  const normalizedRole = String(accessorRole || '').trim();

  if (normalizedRole === 'Admin') {
    return applyAdminExposureRules(userData);
  }

  if (normalizedRole === 'Employee') {
    return applyEmployeeExposureRules(userData);
  }

  if (normalizedRole === 'Client') {
    return applyClientExposureRules(userData, accessorUserId);
  }

  // Por defecto, aplicar reglas más restrictivas (Admin)
  return applyAdminExposureRules(userData);
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'email', 'status', 'isVerified', 'lastLogin', 'createdAt'],
      include: [
        {
          model: UserProfile,
          as: 'UserProfile',
          attributes: ['Name', 'Username', 'PhoneNumber', 'Address', 'DocumentType', 'DocumentNumber', 'Income']
        },
        {
          model: UserEmail,
          as: 'UserEmails',
          attributes: ['email', 'verified']
        },
        {
          model: UserRole,
          as: 'UserRoles',
          include: [
            {
              model: Role,
              as: 'Role',
              attributes: ['name']
            }
          ]
        },
        {
          model: Account,
          as: 'Accounts',
          attributes: ['id', 'accountNumber', 'accountType', 'accountBalance', 'status'],
          include: [
            {
              model: Transaction,
              as: 'Transactions',
              limit: 5,
              order: [['createdAt', 'DESC']],
              attributes: ['id', 'type', 'amount', 'description', 'balanceAfter', 'createdAt', 'status']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const formattedUsers = users.map(user => {
      const userJson = applyAdminExposureRules(user);
      
      const roleName = userJson.UserRoles?.[0]?.Role?.name || 'Cliente';
      
      const totalBalance = userJson.Accounts?.reduce((sum, acc) => {
        return sum + parseFloat(acc.accountBalance || 0);
      }, 0) || 0;
      
      return {
        id: userJson.id,
        email: userJson.email,
        status: userJson.status,
        isVerified: userJson.isVerified,
        lastLogin: userJson.lastLogin,
        createdAt: userJson.createdAt,
        profile: userJson.UserProfile,
        role: roleName,
        totalBalance: totalBalance.toFixed(2),
        accounts: userJson.Accounts?.map(acc => ({
          accountId: acc.id,
          accountNumber: acc.accountNumber,
          accountType: acc.accountType,
          balance: parseFloat(acc.accountBalance || 0).toFixed(2),
          status: acc.status,
          recentTransactions: acc.Transactions || []
        })) || []
      };
    });

    res.status(200).json({
      success: true,
      count: formattedUsers.length,
      data: formattedUsers
    });
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    res.status(500).json({
      success: false,
      msg: 'Error al obtener los usuarios',
      error: err.message
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        msg: 'No tienes permiso para ver este usuario'
      });
    }
    
    const user = await User.findByPk(id, {
      attributes: ['id', 'email', 'status', 'isVerified', 'lastLogin', 'createdAt'],
      include: [
        {
          model: UserProfile,
          as: 'UserProfile',
          attributes: ['Name', 'Username', 'PhoneNumber', 'Address', 'JobName', 'DocumentType', 'DocumentNumber', 'Income']
        },
        {
          model: UserEmail,
          as: 'UserEmails',
          attributes: ['email', 'verified']
        },
        {
          model: Account,
          as: 'Accounts',
          attributes: ['id', 'accountNumber', 'accountType', 'accountBalance', 'status'],
          include: [
            {
              model: Transaction,
              as: 'Transactions',
              limit: 5,
              order: [['createdAt', 'DESC']],
              attributes: ['id', 'type', 'amount', 'description', 'balanceAfter', 'createdAt', 'status']
            }
          ]
        }
      ]
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'Usuario no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
        ? applyAdminExposureRules(user)
        : user
    });
  } catch (err) {
    console.error('Error al obtener usuario:', err);
    res.status(500).json({
      success: false,
      msg: 'Error al obtener el usuario',
      error: err.message
    });
  }
};

export const getAdminClientDetail = async (req, res) => {
  const { id: targetUserId } = req.params;
  const actorUserId = req.user?.id;

  try {
    if (!req.user || req.user.role !== 'Admin') {
      await createSensitiveAudit({
        req,
        actorUserId: actorUserId || 'unknown',
        targetUserId,
        outcome: 'DENIED',
        metadata: { reason: 'Rol insuficiente' }
      });

      return res.status(403).json({
        success: false,
        msg: 'Acceso denegado. Se requiere rol de Administrador'
      });
    }

    const user = await User.findByPk(targetUserId, {
      attributes: ['id', 'email', 'status', 'isVerified', 'lastLogin', 'createdAt'],
      include: [
        {
          model: UserProfile,
          as: 'UserProfile',
          attributes: ['Name', 'Username', 'PhoneNumber', 'Address', 'JobName', 'DocumentType', 'DocumentNumber', 'Income', 'Status']
        },
        {
          model: UserRole,
          as: 'UserRoles',
          attributes: ['id'],
          include: [
            {
              model: Role,
              as: 'Role',
              attributes: ['name']
            }
          ]
        }
      ]
    });

    if (!user) {
      await createSensitiveAudit({
        req,
        actorUserId,
        targetUserId,
        outcome: 'NOT_FOUND',
        metadata: { reason: 'Cliente no encontrado' }
      });

      return res.status(404).json({
        success: false,
        msg: 'Cliente no encontrado'
      });
    }

    const accounts = await Account.findAll({
      where: { userId: targetUserId },
      attributes: ['id', 'accountNumber', 'accountType', 'accountBalance', 'status', 'openedAt', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    const accountIds = accounts.map((account) => account.id);

    const recentTransactions = accountIds.length
      ? await Transaction.findAll({
          where: {
            accountId: {
              [Op.in]: accountIds
            }
          },
          attributes: ['id', 'accountId', 'type', 'amount', 'description', 'balanceAfter', 'status', 'createdAt'],
          order: [['createdAt', 'DESC']],
          limit: 5
        })
      : [];

    const totalAvailableBalance = accounts
      .filter((account) => account.status)
      .reduce((acc, account) => acc + Number(account.accountBalance || 0), 0);

    await createSensitiveAudit({
      req,
      actorUserId,
      targetUserId,
      outcome: 'SUCCESS',
      metadata: {
        accountCount: accounts.length,
        movementsReturned: recentTransactions.length
      }
    });

    const maskedUser = applyAdminExposureRules(user);

    return res.status(200).json({
      success: true,
      data: {
        client: {
          id: maskedUser.id,
          email: maskedUser.email,
          status: maskedUser.status,
          isVerified: maskedUser.isVerified,
          lastLogin: maskedUser.lastLogin,
          createdAt: maskedUser.createdAt,
          role: maskedUser.UserRoles?.[0]?.Role?.name || 'Cliente',
          profile: maskedUser.UserProfile
        },
        accounts,
        availableBalance: totalAvailableBalance.toFixed(2),
        recentMovements: recentTransactions
      }
    });
  } catch (err) {
    await createSensitiveAudit({
      req,
      actorUserId: actorUserId || 'unknown',
      targetUserId,
      outcome: 'ERROR',
      metadata: { error: err.message }
    });

    console.error('Error en vista administrativa de cliente:', err);
    return res.status(500).json({
      success: false,
      msg: 'Error al obtener vista administrativa del cliente',
      error: err.message
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      username,
      phoneNumber,
      address,
      jobName,
      income,
      documentNumber,
      password,
      DocumentNumber 
    } = req.body;
    
    if (req.user.role !== 'Admin' && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        msg: 'No tienes permiso para actualizar este usuario'
      });
    }
    
    if (documentNumber !== undefined || DocumentNumber !== undefined) {
      return res.status(400).json({
        success: false,
        msg: 'No se permite actualizar el número de documento (DPI)'
      });
    }
    
    if (password !== undefined) {
      return res.status(400).json({
        success: false,
        msg: 'No se permite actualizar la contraseña por este endpoint. Use /reset-password'
      });
    }
    
    const user = await User.findByPk(id, {
      include: [UserProfile]
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'Usuario no encontrado'
      });
    }
    
    const updateData = {};
    if (name !== undefined) updateData.Name = name;
    if (username !== undefined) {
      const existingProfile = await UserProfile.findOne({
        where: { Username: username }
      });
      if (existingProfile && existingProfile.UserId !== id) {
        return res.status(409).json({
          success: false,
          msg: 'El username ya está en uso'
        });
      }
      updateData.Username = username;
    }
    if (phoneNumber !== undefined) updateData.PhoneNumber = phoneNumber;
    if (address !== undefined) updateData.Address = address;
    if (jobName !== undefined) updateData.JobName = jobName;
    if (income !== undefined) updateData.Income = income;
    
    if (Object.keys(updateData).length > 0) {
      await user.UserProfile.update(updateData);
    }
    
    await user.reload({
      include: [UserProfile]
    });
    
    const isAdminRequester = req.user?.role === 'Admin';
    const responseUser = isAdminRequester
      ? applyAdminExposureRules({
          id: user.id,
          email: user.email,
          profile: user.UserProfile
        })
      : {
          id: user.id,
          email: user.email,
          profile: user.UserProfile
        };

    res.status(200).json({
      success: true,
      msg: 'Usuario actualizado exitosamente',
      data: {
        id: responseUser.id,
        email: responseUser.email,
        profile: responseUser.profile
      }
    });
  } catch (err) {
    console.error('Error al actualizar usuario:', err);
    res.status(500).json({
      success: false,
      msg: 'Error al actualizar el usuario',
      error: err.message
    });
  }
};

export const editOwnProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        msg: 'Usuario no autenticado'
      });
    }

    const {
      name,
      fullName,
      username,
      address,
      jobName,
      income
    } = req.body;

    const user = await User.findByPk(userId, {
      include: [UserProfile]
    });

    if (!user || !user.UserProfile) {
      return res.status(404).json({
        success: false,
        msg: 'Perfil de usuario no encontrado'
      });
    }

    const updateData = {};

    if (name !== undefined || fullName !== undefined) {
      updateData.Name = fullName ?? name;
    }

    if (username !== undefined) {
      const normalizedUsername = String(username).trim();
      const currentUsername = String(user.UserProfile.Username || '').trim();

      if (normalizedUsername !== currentUsername) {
        const lastUsernameUpdateAt = user.UserProfile.UsernameUpdatedAt
          ? new Date(user.UserProfile.UsernameUpdatedAt)
          : null;

        if (lastUsernameUpdateAt) {
          const now = new Date();
          const msSinceLastChange = now - lastUsernameUpdateAt;
          const cooldownMs = 7 * 24 * 60 * 60 * 1000;

          if (msSinceLastChange < cooldownMs) {
            const remainingMs = cooldownMs - msSinceLastChange;
            const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));

            return res.status(400).json({
              success: false,
              msg: `Solo puedes cambiar tu username una vez cada 7 dias. Intenta nuevamente en ${remainingDays} dia(s)`
            });
          }
        }

        const existingProfile = await UserProfile.findOne({
          where: {
            Username: normalizedUsername,
            UserId: {
              [Op.ne]: userId
            }
          }
        });

        if (existingProfile) {
          return res.status(409).json({
            success: false,
            msg: 'El username ya esta en uso'
          });
        }

        updateData.Username = normalizedUsername;
        updateData.UsernameUpdatedAt = new Date();
      }
    }

    if (address !== undefined) {
      updateData.Address = address;
    }

    if (jobName !== undefined) {
      updateData.JobName = jobName;
    }

    if (income !== undefined) {
      const numericIncome = Number(income);
      if (!Number.isFinite(numericIncome) || numericIncome < 0) {
        return res.status(400).json({
          success: false,
          msg: 'Ingreso mensual invalido'
        });
      }
      updateData.Income = numericIncome;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        msg: 'No hay campos validos para actualizar'
      });
    }

    await user.UserProfile.update(updateData);

    await user.reload({ include: [UserProfile] });

    return res.status(200).json({
      success: true,
      msg: 'Perfil actualizado exitosamente',
      data: {
        id: user.id,
        email: user.email,
        profile: user.UserProfile
      }
    });
  } catch (err) {
    console.error('Error al editar perfil propio:', err);
    return res.status(500).json({
      success: false,
      msg: 'Error al editar perfil',
      error: err.message
    });
  }
};

// Exportar función de enmascarado para uso en otros módulos
export { applyExposureRulesByRole, maskEmail, maskDocumentNumber, maskPhoneNumber, maskAddress };
