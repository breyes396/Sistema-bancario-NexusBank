'use strict';

import Catalog from './catalog.model.js';
import CatalogAudit from './catalogAudit.model.js';
import { Op } from 'sequelize';
import sequelize from '../../configs/db.js';

/**
 * CONTROLADOR DE PROMOCIONES
 * 
 * Gestiona el CRUD completo de promociones con auditoría automática.
 * Solo Admin puede crear, editar y desactivar promociones.
 */

// ============= HELPER FUNCTIONS =============

const createCatalogAudit = async ({
  catalogId,
  action,
  actorUserId,
  previousValues = null,
  newValues = null,
  changedFields = null,
  reason = null,
  ipAddress = null,
  userAgent = null,
  metadata = null
}) => {
  try {
    await CatalogAudit.create({
      catalogId,
      action,
      actorUserId,
      previousValues,
      newValues,
      changedFields,
      reason,
      ipAddress,
      userAgent,
      metadata
    });
  } catch (auditError) {
    console.error('Error registrando auditoría de catálogo:', auditError.message);
  }
};

const isPromotionValid = (promotion) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Verificar si está en el período válido
  if (promotion.startDate) {
    const startDate = new Date(promotion.startDate);
    if (startDate > today) {
      return false; // Aún no ha comenzado
    }
  }

  if (promotion.endDate) {
    const endDate = new Date(promotion.endDate);
    if (endDate < today) {
      return false; // Ya expiró
    }
  }

  // Verificar límite total de usos
  if (promotion.maxUsesTotalPromotion && promotion.usesCountTotal >= promotion.maxUsesTotalPromotion) {
    return false;
  }

  return true;
};

// ============= CONTROLADORES PÚBLICOS =============

/**
 * GET /catalog
 * Listar todas las promociones activas (público)
 */
export const getAllPromotions = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const promotions = await Catalog.findAll({
      where: {
        status: 'ACTIVA',
        [Op.or]: [
          { endDate: { [Op.gte]: today } },
          { endDate: null }
        ]
      },
      attributes: [
        'id', 'name', 'description', 'promotionType',
        'minDepositAmount', 'maxDepositAmount', 
        'minTransferAmount', 'maxTransferAmount',
        'discountPercentage', 'cashbackPercentage', 'cashbackAmount',
        'startDate', 'endDate', 'isExclusive', 'createdAt'
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      message: 'Promociones disponibles',
      count: promotions.length,
      data: promotions
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al obtener promociones',
      error: error.message
    });
  }
};

/**
 * GET /catalog/:id
 * Obtener detalles de una promoción específica (público)
 */
export const getPromotionById = async (req, res) => {
  try {
    const { id } = req.params;

    const promotion = await Catalog.findByPk(id, {
      attributes: [
        'id', 'name', 'description', 'promotionType',
        'minDepositAmount', 'maxDepositAmount',
        'minTransferAmount', 'maxTransferAmount',
        'minConsecutiveTransactions', 'minAccountBalance',
        'discountPercentage', 'cashbackPercentage', 'cashbackAmount',
        'bonusPoints', 'maxUsesPerClient', 'maxUsesTotalPromotion',
        'usesCountTotal', 'startDate', 'endDate', 'status',
        'isExclusive', 'createdAt'
      ]
    });

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promoción no encontrada'
      });
    }

    const isValid = isPromotionValid(promotion);

    return res.status(200).json({
      success: true,
      data: {
        ...promotion.toJSON(),
        isCurrentlyValid: isValid
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al obtener promoción',
      error: error.message
    });
  }
};

// ============= CONTROLADORES ADMIN =============

/**
 * GET /catalog/admin/all
 * Listar TODAS las promociones (Admin)
 */
export const getAllPromotionsAdmin = async (req, res) => {
  try {
    const { status, type, active } = req.query;
    
    let whereClause = {};
    
    if (status) {
      whereClause.status = status.toUpperCase();
    }
    
    if (type) {
      whereClause.promotionType = type.toUpperCase();
    }

    if (active === 'true') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      whereClause = {
        ...whereClause,
        status: 'ACTIVA',
        [Op.or]: [
          { endDate: { [Op.gte]: today } },
          { endDate: null }
        ]
      };
    }

    const promotions = await Catalog.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      count: promotions.length,
      data: promotions
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al obtener promociones',
      error: error.message
    });
  }
};

/**
 * POST /catalog/admin/create
 * Crear nueva promoción (Admin)
 */
export const createPromotion = async (req, res) => {
  try {
    const adminUserId = req.user?.id;
    const {
      name, description, promotionType,
      minDepositAmount, maxDepositAmount,
      minTransferAmount, maxTransferAmount,
      minConsecutiveTransactions, minAccountBalance,
      discountPercentage, cashbackPercentage, cashbackAmount,
      bonusPoints, maxUsesPerClient, maxUsesTotalPromotion,
      startDate, endDate, daysOfWeekApplicable,
      isExclusive, notes
    } = req.body;

    // Validaciones
    if (!name || !promotionType) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y tipo de promoción son requeridos'
      });
    }

    const validTypes = [
      'DEPOSITO_CASHBACK', 'TRANSFERENCIA_DESCUENTO',
      'TRANSFERENCIA_PROPIA_BONUS', 'TRANSACCIONES_FRECUENTES',
      'SALDO_MINIMO_REWARD', 'APERTURA_CUENTA_BONUS'
    ];

    if (!validTypes.includes(promotionType)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de promoción inválido',
        validTypes
      });
    }

    // Validar que al menos haya un beneficio
    if (!discountPercentage && !cashbackPercentage && !cashbackAmount && !bonusPoints) {
      return res.status(400).json({
        success: false,
        message: 'La promoción debe tener al menos un beneficio (descuento, cashback o puntos)'
      });
    }

    const newPromotion = await Catalog.create({
      name,
      description,
      promotionType,
      minDepositAmount: minDepositAmount || null,
      maxDepositAmount: maxDepositAmount || null,
      minTransferAmount: minTransferAmount || null,
      maxTransferAmount: maxTransferAmount || null,
      minConsecutiveTransactions: minConsecutiveTransactions || null,
      minAccountBalance: minAccountBalance || null,
      discountPercentage: discountPercentage || null,
      cashbackPercentage: cashbackPercentage || null,
      cashbackAmount: cashbackAmount || null,
      bonusPoints: bonusPoints || null,
      maxUsesPerClient: maxUsesPerClient || null,
      maxUsesTotalPromotion: maxUsesTotalPromotion || null,
      startDate: startDate || null,
      endDate: endDate || null,
      daysOfWeekApplicable: daysOfWeekApplicable || null,
      isExclusive: isExclusive || false,
      createdBy: adminUserId,
      notes: notes || null
    });

    // Registrar en auditoría
    await createCatalogAudit({
      catalogId: newPromotion.id,
      action: 'CREAR',
      actorUserId: adminUserId,
      newValues: newPromotion.toJSON(),
      reason: `Nueva promoción creada: ${name}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.status(201).json({
      success: true,
      message: 'Promoción creada exitosamente',
      data: newPromotion
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al crear promoción',
      error: error.message
    });
  }
};

/**
 * PUT /catalog/admin/:id
 * Actualizar promoción (Admin)
 */
export const updatePromotion = async (req, res) => {
  try {
    const adminUserId = req.user?.id;
    const { id } = req.params;
    const updateData = req.body;

    const promotion = await Catalog.findByPk(id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promoción no encontrada'
      });
    }

    // Guardar valores anteriores para auditoría
    const previousValues = promotion.toJSON();

    // Actualizar solo campos permitidos
    const allowedFields = [
      'name', 'description', 'minDepositAmount', 'maxDepositAmount',
      'minTransferAmount', 'maxTransferAmount', 'minConsecutiveTransactions',
      'minAccountBalance', 'discountPercentage', 'cashbackPercentage',
      'cashbackAmount', 'bonusPoints', 'maxUsesPerClient', 'maxUsesTotalPromotion',
      'startDate', 'endDate', 'daysOfWeekApplicable', 'isExclusive', 'notes'
    ];

    let changedFields = [];
    allowedFields.forEach((field) => {
      if (updateData.hasOwnProperty(field)) {
        promotion[field] = updateData[field];
        changedFields.push(field);
      }
    });

    promotion.updatedBy = adminUserId;
    await promotion.save();

    // Registrar en auditoría
    if (changedFields.length > 0) {
      await createCatalogAudit({
        catalogId: promotion.id,
        action: 'ACTUALIZAR',
        actorUserId: adminUserId,
        previousValues,
        newValues: promotion.toJSON(),
        changedFields,
        reason: updateData.reason || 'Actualización de promoción',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Promoción actualizada exitosamente',
      data: promotion
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar promoción',
      error: error.message
    });
  }
};

/**
 * PUT /catalog/admin/:id/status
 * Cambiar estado de promoción (Admin)
 */
export const updatePromotionStatus = async (req, res) => {
  try {
    const adminUserId = req.user?.id;
    const { id } = req.params;
    const { newStatus, reason } = req.body;

    const validStatuses = ['ACTIVA', 'INACTIVA', 'PAUSADA', 'EXPIRADA'];

    if (!newStatus || !validStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido',
        validStatuses
      });
    }

    const promotion = await Catalog.findByPk(id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promoción no encontrada'
      });
    }

    const previousStatus = promotion.status;
    promotion.status = newStatus;
    promotion.updatedBy = adminUserId;
    await promotion.save();

    // Registrar en auditoría
    const actionMap = {
      'INACTIVA': 'DESACTIVAR',
      'PAUSADA': 'PAUSAR',
      'ACTIVA': 'REACTIVAR'
    };

    await createCatalogAudit({
      catalogId: promotion.id,
      action: actionMap[newStatus] || 'ACTUALIZAR',
      actorUserId: adminUserId,
      previousValues: { status: previousStatus },
      newValues: { status: newStatus },
      changedFields: ['status'],
      reason: reason || `Cambio de estado de ${previousStatus} a ${newStatus}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.status(200).json({
      success: true,
      message: `Promoción ${newStatus.toLowerCase()} exitosamente`,
      data: promotion
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al cambiar estado de promoción',
      error: error.message
    });
  }
};

/**
 * GET /catalog/admin/:id/audit
 * Ver historial de auditoría de una promoción (Admin)
 */
export const getPromotionAudit = async (req, res) => {
  try {
    const { id } = req.params;

    const auditRecords = await CatalogAudit.findAll({
      where: { catalogId: id },
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      count: auditRecords.length,
      data: auditRecords
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al obtener auditoría',
      error: error.message
    });
  }
};

/**
 * GET /catalog/admin/audit/all
 * Ver auditoría global de todas las promociones (Admin)
 */
export const getAllAudit = async (req, res) => {
  try {
    const { action, actorUserId, limit = 50, offset = 0 } = req.query;

    let whereClause = {};

    if (action) {
      whereClause.action = action.toUpperCase();
    }

    if (actorUserId) {
      whereClause.actorUserId = actorUserId;
    }

    const { count, rows } = await CatalogAudit.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: Math.min(parseInt(limit), 100),
      offset: parseInt(offset)
    });

    return res.status(200).json({
      success: true,
      total: count,
      limit: Math.min(parseInt(limit), 100),
      offset: parseInt(offset),
      data: rows
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al obtener auditoría',
      error: error.message
    });
  }
};

/**
 * DELETE /catalog/admin/:id
 * Eliminar promoción (Admin) - Soft delete via status
 */
export const deletePromotion = async (req, res) => {
  try {
    const adminUserId = req.user?.id;
    const { id } = req.params;
    const { reason } = req.body;

    const promotion = await Catalog.findByPk(id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promoción no encontrada'
      });
    }

    const previousStatus = promotion.status;
    promotion.status = 'INACTIVA';
    promotion.updatedBy = adminUserId;
    await promotion.save();

    // Registrar en auditoría
    await createCatalogAudit({
      catalogId: promotion.id,
      action: 'DESACTIVAR',
      actorUserId: adminUserId,
      previousValues: { status: previousStatus },
      newValues: { status: 'INACTIVA' },
      changedFields: ['status'],
      reason: reason || 'Promoción desactivada',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.status(200).json({
      success: true,
      message: 'Promoción desactivada exitosamente'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al desactivar promoción',
      error: error.message
    });
  }
};
