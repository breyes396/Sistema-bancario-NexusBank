'use strict';

import { Op } from 'sequelize';
import { User, UserProfile } from './user.model.js';
import { UserEmail } from '../auth/userEmail.model.js';
import { Role, UserRole } from '../auth/role.model.js';
import { Account } from '../account/account.model.js';
import { Transaction } from '../transaction/transaction.model.js';
import { SensitiveQueryAudit } from './sensitiveAudit.model.js';
import { sendError, sendSuccess } from '../../helpers/response.js';
import { ERROR_CODES } from '../../helpers/error-catalog.js';
import { withTimeout, getJsonByteSize } from '../../helpers/endpoint-performance.js';
import { getPaginatedUsersLight, getUserDetailHeavyById } from './services/user-read.service.js';
import {
  applyAdminExposureRules,
  applyExposureRulesByRole
} from './services/user-masking.service.js';

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

const normalizeRoleToDbName = (roleValue) => {
  if (!roleValue) return null;

  const normalized = String(roleValue).trim().toLowerCase();

  if (normalized === 'admin' || normalized === 'administrador') return 'Administrador';
  if (normalized === 'employee' || normalized === 'empleado') return 'Empleado';
  if (normalized === 'client' || normalized === 'cliente') return 'Cliente';

  return null;
};

export const getAllUsers = async (req, res) => {
  try {
    const MAX_LIST_RESPONSE_BYTES = 250000;
    const LIST_TIMEOUT_MS = 5000;

    const result = await withTimeout(
      getPaginatedUsersLight(req.query),
      LIST_TIMEOUT_MS,
      'Tiempo de espera agotado al listar usuarios'
    );

    const payloadSize = getJsonByteSize(result.data);
    if (payloadSize > MAX_LIST_RESPONSE_BYTES) {
      return sendError(res, {
        status: 413,
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'El tamaño del payload excede el máximo permitido para listados'
      });
    }

    return sendSuccess(res, {
      status: 200,
      message: 'Usuarios obtenidos exitosamente',
      data: {
        items: result.data,
        meta: result.meta
      }
    });
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    return sendError(res, {
      status: 500,
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'Error al obtener los usuarios',
      details: err.message
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
    
    const user = await withTimeout(
      getUserDetailHeavyById(id),
      7000,
      'Tiempo de espera agotado al obtener detalle de usuario'
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'Usuario no encontrado'
      });
    }
    
    return sendSuccess(res, {
      status: 200,
      message: 'Usuario obtenido exitosamente',
      data: user
        ? applyAdminExposureRules(user)
        : user
    });
  } catch (err) {
    console.error('Error al obtener usuario:', err);
    return sendError(res, {
      status: 500,
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'Error al obtener el usuario',
      details: err.message
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
      role,
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

    let normalizedRoleToUpdate = null;
    if (role !== undefined) {
      if (req.user.role !== 'Admin') {
        return res.status(403).json({
          success: false,
          msg: 'Solo un administrador puede cambiar el rol'
        });
      }

      normalizedRoleToUpdate = normalizeRoleToDbName(role);
      if (!normalizedRoleToUpdate) {
        return res.status(400).json({
          success: false,
          msg: 'Rol invalido. Valores permitidos: Admin, Employee, Client'
        });
      }
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
      include: [
        { model: UserProfile, as: 'UserProfile' },
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
        }
      ]
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'Usuario no encontrado'
      });
    }

    // Proteger usuarios Admin: solo ellos mismos pueden modificarse
    const targetUserRole = user.UserRoles?.[0]?.Role?.name;
    if (targetUserRole === 'Administrador' && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        msg: 'Un administrador solo puede ser modificado por si mismo'
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

    if (normalizedRoleToUpdate) {
      const targetRole = await Role.findOne({ where: { name: normalizedRoleToUpdate } });

      if (!targetRole) {
        return res.status(404).json({
          success: false,
          msg: `Rol no encontrado en base de datos: ${normalizedRoleToUpdate}`
        });
      }

      const userRole = await UserRole.findOne({ where: { UserId: id } });

      if (userRole) {
        userRole.RoleId = targetRole.id;
        await userRole.save();
      } else {
        await UserRole.create({
          UserId: id,
          RoleId: targetRole.id
        });
      }
    }
    
    await user.reload({
      include: [{ model: UserProfile, as: 'UserProfile' }]
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
        profile: responseUser.profile,
        role: normalizedRoleToUpdate || undefined
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
      include: [{ model: UserProfile, as: 'UserProfile' }]
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

    await user.reload({ include: [{ model: UserProfile, as: 'UserProfile' }] });

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

