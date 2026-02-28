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

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'email', 'status', 'isVerified', 'lastLogin', 'createdAt'],
      include: [
        {
          model: UserProfile,
          attributes: ['Name', 'Username', 'PhoneNumber', 'Address', 'DocumentType', 'DocumentNumber', 'Income']
        },
        {
          model: UserEmail,
          attributes: ['email', 'verified']
        },
        {
          model: UserRole,
          include: [
            {
              model: Role,
              attributes: ['name']
            }
          ]
        },
        {
          model: Account,
          attributes: ['id', 'accountNumber', 'accountType', 'accountBalance', 'status'],
          include: [
            {
              model: Transaction,
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
      const userJson = user.toJSON();
      
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

    return res.status(200).json({
      success: true,
      data: {
        client: {
          id: user.id,
          email: user.email,
          status: user.status,
          isVerified: user.isVerified,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          role: user.UserRoles?.[0]?.Role?.name || 'Cliente',
          profile: user.UserProfile
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
    
    res.status(200).json({
      success: true,
      msg: 'Usuario actualizado exitosamente',
      data: {
        id: user.id,
        email: user.email,
        profile: user.UserProfile
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
