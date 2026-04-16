'use strict';

import Catalog from './catalog.model.js';
import CatalogAudit from './catalogAudit.model.js';

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

  if (promotion.startDate) {
    const startDate = new Date(promotion.startDate);
    if (startDate > today) {
      return false; 
    }
  }

  if (promotion.endDate) {
    const endDate = new Date(promotion.endDate);
    if (endDate < today) {
      return false; 
    }
  }

  if (promotion.maxUsesTotalPromotion && promotion.usesCountTotal >= promotion.maxUsesTotalPromotion) {
    return false; 
  }

  return true; 
};

export const validateAndApplyCoupon = async (couponId, operationType, amount, dbTransaction = null) => {
  try {

    if (!couponId || typeof couponId !== 'string') {
      return {
        valid: false,
        message: 'Cupón inválido: ID no proporcionado'
      };
    }

    const promotion = await Catalog.findById(couponId);

    if (!promotion) {
      return {
        valid: false,
        message: 'Cupón inválido: promoción no encontrada'
      };
    }

    if (promotion.status !== 'ACTIVA') {
      return {
        valid: false,
        message: 'Cupón inválido: promoción no está activa'
      };
    }

    if (!isPromotionValid(promotion)) {
      return {
        valid: false,
        message: 'Cupón inválido: promoción expirada o límite alcanzado'
      };
    }

    const operationToPromoTypeMap = {
      'DEPOSITO': 'DEPOSITO_CASHBACK',
      'TRANSFERENCIA_TERCERO': 'TRANSFERENCIA_DESCUENTO',
      'TRANSFERENCIA_PROPIA': 'TRANSFERENCIA_PROPIA_BONUS'
    };

    const expectedPromoType = operationToPromoTypeMap[operationType];

    if (promotion.promotionType !== expectedPromoType) {
      return {
        valid: false,
        message: `Cupón inválido: esta promoción no aplica para ${operationType.toLowerCase().replace('_', ' ')}`
      };
    }

    let benefit = null;

    switch (promotion.promotionType) {
      case 'DEPOSITO_CASHBACK':

        if (promotion.minDepositAmount && amount < promotion.minDepositAmount) {
          return {
            valid: false,
            message: `Cupón inválido: el depósito debe ser mínimo Q${promotion.minDepositAmount}`
          };
        }
        if (promotion.maxDepositAmount && amount > promotion.maxDepositAmount) {
          return {
            valid: false,
            message: `Cupón inválido: el depósito no puede exceder Q${promotion.maxDepositAmount}`
          };
        }

        let cashbackAmount = 0;
        if (promotion.cashbackPercentage) {
          cashbackAmount = (amount * promotion.cashbackPercentage) / 100;
        } else if (promotion.cashbackAmount) {
          cashbackAmount = promotion.cashbackAmount;
        }

        benefit = {
          type: 'CASHBACK',
          amount: Number(cashbackAmount.toFixed(2)),
          description: `Cashback de Q${cashbackAmount.toFixed(2)} por depósito`
        };
        break;

      case 'TRANSFERENCIA_DESCUENTO':
        if (promotion.minTransferAmount && amount < promotion.minTransferAmount) {
          return {
            valid: false,
            message: `Cupón inválido: la transferencia debe ser mínimo Q${promotion.minTransferAmount}`
          };
        }
        if (promotion.maxTransferAmount && amount > promotion.maxTransferAmount) {
          return {
            valid: false,
            message: `Cupón inválido: la transferencia no puede exceder Q${promotion.maxTransferAmount}`
          };
        }

        let discountAmount = 0;
        if (promotion.discountPercentage) {
          discountAmount = (amount * promotion.discountPercentage) / 100;
        }

        benefit = {
          type: 'DISCOUNT',
          amount: Number(discountAmount.toFixed(2)),
          description: `Descuento de Q${discountAmount.toFixed(2)} (${promotion.discountPercentage}%) en transferencia`
        };
        break;

      case 'TRANSFERENCIA_PROPIA_BONUS':

        if (promotion.minTransferAmount && amount < promotion.minTransferAmount) {
          return {
            valid: false,
            message: `Cupón inválido: la transferencia debe ser mínimo Q${promotion.minTransferAmount}`
          };
        }

        let bonusAmount = 0;
        if (promotion.bonusPoints) {
          benefit = {
            type: 'BONUS_POINTS',
            amount: promotion.bonusPoints,
            description: `${promotion.bonusPoints} puntos bonus por transferencia entre cuentas propias`
          };
        } else if (promotion.cashbackAmount) {
          bonusAmount = promotion.cashbackAmount;
          benefit = {
            type: 'CASHBACK',
            amount: Number(bonusAmount.toFixed(2)),
            description: `Bonus de Q${bonusAmount.toFixed(2)} por transferencia propia`
          };
        }
        break;

      default:
        return {
          valid: false,
          message: 'Cupón inválido: tipo de promoción no soportado'
        };
    }

    return {
      valid: true,
      message: 'Cupón válido',
      promotion: {
        id: promotion.id,
        name: promotion.name,
        description: promotion.description,
        promotionType: promotion.promotionType
      },
      benefit
    };

  } catch (error) {
    console.error('Error validando cupón:', error);
    return {
      valid: false,
      message: 'Error al validar el cupón'
    };
  }
};

export const incrementPromotionUsage = async (couponId, dbTransaction = null) => {
  try {
    await Catalog.findByIdAndUpdate(
      couponId,
      { $inc: { usesCountTotal: 1 } },
      { new: true }
    );
  } catch (error) {
    console.error('Error incrementando uso de promoción:', error);
  }
};

export const getAllPromotions = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const promotions = await Catalog.find({
      status: 'ACTIVA',
      $or: [
        { endDate: { $gte: today } },
        { endDate: null }
      ]
    })
    .select('_id name description promotionType minDepositAmount maxDepositAmount minTransferAmount maxTransferAmount discountPercentage cashbackPercentage cashbackAmount startDate endDate isExclusive createdAt')
    .sort({ createdAt: -1 });

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

export const getPromotionById = async (req, res) => {
  try {
    const { id } = req.params;

    const promotion = await Catalog.findById(id)
      .select('_id name description promotionType minDepositAmount maxDepositAmount minTransferAmount maxTransferAmount minConsecutiveTransactions minAccountBalance discountPercentage cashbackPercentage cashbackAmount bonusPoints maxUsesPerClient maxUsesTotalPromotion usesCountTotal startDate endDate status isExclusive createdAt');

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
        ...promotion.toObject(),
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

export const getAllPromotionsAdmin = async (req, res) => {
  try {
    const { status, type, active } = req.query;
    
    let query = {}; 
    
    if (status) {
      query.status = status.toUpperCase();
    }
    
    if (type) {
      query.promotionType = type.toUpperCase();
    }

    if (active === 'true') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query = {
        ...query,
        status: 'ACTIVA',
        $or: [
          { endDate: { $gte: today } },
          { endDate: null }
        ]
      };
    }

    const promotions = await Catalog.find(query)
      .sort({ createdAt: -1 });

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

    await createCatalogAudit({
      catalogId: newPromotion._id,
      action: 'CREAR',
      actorUserId: adminUserId,
      newValues: newPromotion.toObject(), 
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

export const updatePromotion = async (req, res) => {
  try {
    const adminUserId = req.user?.id;
    const { id } = req.params;
    const updateData = req.body;

    const promotion = await Catalog.findById(id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promoción no encontrada'
      });
    }

    const previousValues = promotion.toObject();

    const allowedFields = [
      'name', 'description', 'minDepositAmount', 'maxDepositAmount',
      'minTransferAmount', 'maxTransferAmount', 'minConsecutiveTransactions',
      'minAccountBalance', 'discountPercentage', 'cashbackPercentage',
      'cashbackAmount', 'bonusPoints', 'maxUsesPerClient', 'maxUsesTotalPromotion',
      'startDate', 'endDate', 'daysOfWeekApplicable', 'isExclusive', 'notes'
    ];

    let changedFields = [];
    const updatePayload = {};
    
    allowedFields.forEach((field) => {
      if (updateData.hasOwnProperty(field)) {
        updatePayload[field] = updateData[field];
        changedFields.push(field);
      }
    });

    updatePayload.updatedBy = adminUserId; 

    const updatedPromotion = await Catalog.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true, runValidators: true }
    );

    if (changedFields.length > 0) {
      await createCatalogAudit({
        catalogId: updatedPromotion._id,
        action: 'ACTUALIZAR',
        actorUserId: adminUserId,
        previousValues, 
        newValues: updatedPromotion.toObject(), 
        changedFields, 
        reason: updateData.reason || 'Actualización de promoción',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Promoción actualizada exitosamente',
      data: updatedPromotion
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar promoción',
      error: error.message
    });
  }
};

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

    const promotion = await Catalog.findById(id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promoción no encontrada'
      });
    }

    const previousStatus = promotion.status;
    
    const updatedPromotion = await Catalog.findByIdAndUpdate(
      id,
      { status: newStatus, updatedBy: adminUserId },
      { new: true, runValidators: true }
    );

    const actionMap = {
      'INACTIVA': 'DESACTIVAR',
      'PAUSADA': 'PAUSAR',
      'ACTIVA': 'REACTIVAR'
    };

    await createCatalogAudit({
      catalogId: updatedPromotion._id,
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
      data: updatedPromotion
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al cambiar estado de promoción',
      error: error.message
    });
  }
};

export const getPromotionAudit = async (req, res) => {
  try {
    const { id } = req.params;

    const auditRecords = await CatalogAudit.find({ catalogId: id })
      .sort({ createdAt: -1 }); 

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

export const getAllAudit = async (req, res) => {
  try {
    const { action, actorUserId, limit = 50, offset = 0 } = req.query;

    let query = {};

    if (action) {
      query.action = action.toUpperCase();
    }

    if (actorUserId) {
      query.actorUserId = actorUserId;
    }

    const count = await CatalogAudit.countDocuments(query);
    const limitValue = Math.min(parseInt(limit), 100); 
    const offsetValue = parseInt(offset);

    const rows = await CatalogAudit.find(query)
      .sort({ createdAt: -1 })
      .limit(limitValue)
      .skip(offsetValue);

    return res.status(200).json({
      success: true,
      total: count, 
      limit: limitValue,
      offset: offsetValue,
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

export const deletePromotion = async (req, res) => {
  try {
    const adminUserId = req.user?.id;
    const { id } = req.params;
    const { reason } = req.body;

    const promotion = await Catalog.findById(id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promoción no encontrada'
      });
    }

    const previousStatus = promotion.status;
    
    const updatedPromotion = await Catalog.findByIdAndUpdate(
      id,
      { status: 'INACTIVA', updatedBy: adminUserId },
      { new: true, runValidators: true }
    );

    await createCatalogAudit({
      catalogId: updatedPromotion._id,
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
