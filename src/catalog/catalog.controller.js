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

/**
 * isPromotionValid
 * 
 * Función auxiliar que determina si una promoción está actualmente válida y aplicable.
 * Evalúa tres criterios principales:
 * 1. Fecha de inicio: La promoción ya debe haber comenzado
 * 2. Fecha de fin: La promoción no debe haber expirado
 * 3. Límite de usos: No debe haber alcanzado su límite máximo de aplicación
 * 
 * Lógica:
 * - Si tiene startDate y aún no ha llegado → false
 * - Si tiene endDate y ya pasó → false
 * - Si tiene maxUsesTotalPromotion y usesCountTotal >= max → false
 * - En cualquier otro caso → true
 */
const isPromotionValid = (promotion) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalizar a medianoche para comparación diaria

  // Verificar si la promoción ya inició
  if (promotion.startDate) {
    const startDate = new Date(promotion.startDate);
    if (startDate > today) {
      return false; // Aún no ha comenzado, no aplicable
    }
  }

  // Verificar si la promoción ya expiró
  if (promotion.endDate) {
    const endDate = new Date(promotion.endDate);
    if (endDate < today) {
      return false; // Ya pasó la fecha de fin, no aplicable
    }
  }

  // Verificar si se alcanzó el límite global de usos
  if (promotion.maxUsesTotalPromotion && promotion.usesCountTotal >= promotion.maxUsesTotalPromotion) {
    return false; // Límite de usos totales alcanzado
  }

  return true; // La promoción es válida y aplicable
};

/**
 * validateAndApplyCoupon
 * 
 * Función auxiliar que valida un cupón de promoción y calcula el beneficio aplicable.
 * Utilizada por las operaciones bancarias (transferencias, depósitos) para aplicar descuentos.
 * 
 * Parámetros:
 * @param {string} couponId - ID de la promoción a aplicar (formato: cat_XXXXXXXXXXXX)
 * @param {string} operationType - Tipo de operación: DEPOSITO, TRANSFERENCIA_PROPIA, TRANSFERENCIA_TERCERO
 * @param {number} amount - Monto de la operación en moneda base
 * @param {object} dbTransaction - Transacción de Sequelize para consistencia (opcional)
 * 
 * Retorna:
 * @returns {object} - Objeto con información del cupón aplicado
 *   - valid: boolean - Si el cupón es válido
 *   - message: string - Mensaje explicativo
 *   - promotion: object - Datos de la promoción (si es válida)
 *   - benefit: object - Beneficio calculado según tipo de promoción
 *     - type: string - Tipo de beneficio (DISCOUNT, CASHBACK, BONUS_POINTS)
 *     - amount: number - Monto del beneficio
 *     - description: string - Descripción del beneficio aplicado
 * 
 * Lógica:
 * 1. Busca la promoción por ID
 * 2. Valida que exista y esté activa
 * 3. Valida vigencia temporal y límites de uso
 * 4. Verifica que el tipo de promoción coincida con la operación
 * 5. Calcula el beneficio según las condiciones de la promoción
 * 6. Retorna información para aplicar en la operación bancaria
 */
export const validateAndApplyCoupon = async (couponId, operationType, amount, dbTransaction = null) => {
  try {
    // Validar que se proporcione un cupón
    if (!couponId || typeof couponId !== 'string') {
      return {
        valid: false,
        message: 'Cupón inválido: ID no proporcionado'
      };
    }

    // Buscar la promoción en la base de datos
    const promotion = await Catalog.findById(couponId);

    // Validar que la promoción exista
    if (!promotion) {
      return {
        valid: false,
        message: 'Cupón inválido: promoción no encontrada'
      };
    }

    // Validar que esté activa
    if (promotion.status !== 'ACTIVA') {
      return {
        valid: false,
        message: 'Cupón inválido: promoción no está activa'
      };
    }

    // Validar vigencia temporal y límites
    if (!isPromotionValid(promotion)) {
      return {
        valid: false,
        message: 'Cupón inválido: promoción expirada o límite alcanzado'
      };
    }

    // Mapear tipo de operación a tipo de promoción esperado
    const operationToPromoTypeMap = {
      'DEPOSITO': 'DEPOSITO_CASHBACK',
      'TRANSFERENCIA_TERCERO': 'TRANSFERENCIA_DESCUENTO',
      'TRANSFERENCIA_PROPIA': 'TRANSFERENCIA_PROPIA_BONUS'
    };

    const expectedPromoType = operationToPromoTypeMap[operationType];

    // Validar que el tipo de promoción coincida con la operación
    if (promotion.promotionType !== expectedPromoType) {
      return {
        valid: false,
        message: `Cupón inválido: esta promoción no aplica para ${operationType.toLowerCase().replace('_', ' ')}`
      };
    }

    // Calcular beneficio según el tipo de promoción
    let benefit = null;

    switch (promotion.promotionType) {
      case 'DEPOSITO_CASHBACK':
        // Validar condiciones del depósito
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

        // Calcular cashback
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
        // Validar condiciones de transferencia
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

        // Calcular descuento (reducción en comisión o monto)
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
        // Validar condiciones
        if (promotion.minTransferAmount && amount < promotion.minTransferAmount) {
          return {
            valid: false,
            message: `Cupón inválido: la transferencia debe ser mínimo Q${promotion.minTransferAmount}`
          };
        }

        // Calcular bonus (puntos o monto adicional)
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

    // Retornar información de cupón válido
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

/**
 * incrementPromotionUsage
 * 
 * Incrementa el contador de uso de una promoción después de ser aplicada exitosamente.
 * 
 * Parámetros:
 * @param {string} couponId - ID de la promoción
 * @param {object} dbTransaction - Transacción de Sequelize
 */
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

// ============= CONTROLADORES PÚBLICOS =============
// Estos endpoints son accesibles para cualquier usuario sin necesidad de autenticación.
// Permiten consultar las promociones disponibles y sus detalles.

/**
 * getAllPromotions
 * Endpoint: GET /catalog
 * Acceso: Público (sin autenticación)
 * 
 * Propósito:
 * Retorna una lista de todas las promociones actualmente disponibles para los clientes.
 * Solo muestra promociones que están ACTIVAS y dentro de su período de vigencia.
 * 
 * Lógica:
 * 1. Obtiene la fecha actual normalizada a medianoche
 * 2. Consulta promociones con status='ACTIVA'
 * 3. Filtra por fecha de fin: solo promociones que no han expirado (endDate >= hoy o sin endDate)
 * 4. Excluye campos sensibles como createdBy, updatedBy, maxUsesTotalPromotion, usesCountTotal
 * 5. Ordena por fecha de creación descendente (más recientes primero)
 * 
 * Respuestas:
 * 200 - Lista de promociones con conteo
 * 500 - Error del servidor
 */
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

/**
 * getPromotionById
 * Endpoint: GET /catalog/:id
 * Acceso: Público (sin autenticación)
 * 
 * Propósito:
 * Retorna información detallada de una promoción específica.
 * Incluye más campos que el listado general, como límites de uso y términos.
 * Además evalúa si la promoción está actualmente válida (vigente y sin límites agotados).
 * Lógica:
 * 1. Busca la promoción por su ID primario
 * 2. Incluye campos adicionales como bonusPoints, maxUsesPerClient, maxUsesTotalPromotion
 * 3. Evalúa validez actual usando la función isPromotionValid
 * 4. Retorna la promoción con bandera isCurrentlyValid
*/
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

    // Evaluar si la promoción está actualmente válida (vigencia y límites)
    const isValid = isPromotionValid(promotion);

    return res.status(200).json({
      success: true,
      data: {
        ...promotion.toObject(),
        isCurrentlyValid: isValid // Bandera adicional de validez
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
// Estos endpoints requieren autenticación y rol de Administrador.
// Permiten la gestión completa del catálogo de promociones con auditoría automática.

/**
 * getAllPromotionsAdmin
 * Endpoint: GET /catalog/admin/all
 * Acceso: Solo Admin (requiere auth + role middleware)
 * 
 * Propósito:
 * Retorna TODAS las promociones sin filtros restrictivos, incluyendo inactivas, pausadas y expiradas.
 * Permite a los administradores ver el estado completo del catálogo.

 * Lógica:
 * 1. Construye cláusula WHERE dinámica según parámetros recibidos
 * 2. Si active='true', replica filtros del endpoint público
 * 3. Retorna todos los campos (sin restricciones de visibilidad)
 * 4. Ordena por fecha de creación descendente

 */
export const getAllPromotionsAdmin = async (req, res) => {
  try {
    const { status, type, active } = req.query;
    
    let query = {}; // Construcción dinámica de filtros
    
    // Filtro por estado si se especifica
    if (status) {
      query.status = status.toUpperCase();
    }
    
    // Filtro por tipo de promoción si se especifica
    if (type) {
      query.promotionType = type.toUpperCase();
    }

    // Si active='true', aplicar filtros de vigencia temporal
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

/**
 * createPromotion
 * Endpoint: POST /catalog/admin/create
 * Acceso: Solo Admin
 * 
 * Propósito:
 * Crea una nueva promoción bancaria con todas sus condiciones y beneficios.
 * Registra automáticamente la acción en la tabla de auditoría.
 * 
 * Validaciones:
 * 1. name y promotionType son obligatorios
 * 2. promotionType debe estar en la lista de tipos válidos
 * 3. Debe tener al menos un beneficio (descuento, cashback o puntos)
 * 
 * Lógica:
 * 1. Valida campos requeridos y tipo de promoción
 * 2. Verifica que tenga al menos un beneficio definido
 * 3. Crea el registro en la tabla catalogs
 * 4. Registra la acción CREAR en catalog_audits
 * 5. Captura IP y User-Agent del administrador

 */
export const createPromotion = async (req, res) => {
  try {
    const adminUserId = req.user?.id; // ID del admin autenticado en JWT
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

    // Validación: campos requeridos
    if (!name || !promotionType) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y tipo de promoción son requeridos'
      });
    }

    // Validación: tipo de promoción debe ser correcto
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

    // Validación: debe tener al menos un beneficio
    if (!discountPercentage && !cashbackPercentage && !cashbackAmount && !bonusPoints) {
      return res.status(400).json({
        success: false,
        message: 'La promoción debe tener al menos un beneficio (descuento, cashback o puntos)'
      });
    }

    // Crear el registro de promoción
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
      createdBy: adminUserId, // Registrar quién creó
      notes: notes || null
    });

    // Registrar acción en auditoría
    await createCatalogAudit({
      catalogId: newPromotion._id,
      action: 'CREAR',
      actorUserId: adminUserId,
      newValues: newPromotion.toObject(), // Todos los datos de la nueva promoción
      reason: `Nueva promoción creada: ${name}`,
      ipAddress: req.ip, // IP del admin
      userAgent: req.headers['user-agent'] // Navegador usado
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
 * updatePromotion
 * Endpoint: PUT /catalog/admin/:id
 * Acceso: Solo Admin
 * 
 * Propósito:
 * Actualiza campos de una promoción existente.
 * Registra automáticamente qué campos cambiaron, sus valores anteriores y nuevos.

 * Campos actualizables:
 * name, description, minDepositAmount, maxDepositAmount, minTransferAmount,
 * maxTransferAmount, minConsecutiveTransactions, minAccountBalance,
 * discountPercentage, cashbackPercentage, cashbackAmount, bonusPoints,
 * maxUsesPerClient, maxUsesTotalPromotion, startDate, endDate,
 * daysOfWeekApplicable, isExclusive, notes
 * 
 * Lógica:
 * 1. Busca la promoción por ID
 * 2. Guarda valores actuales para auditoría
 * 3. Actualiza solo los campos en allowedFields que vengan en el body
 * 4. Identifica qué campos cambiaron
 * 5. Registra updatedBy con el ID del admin actual
 * 6. Guarda los cambios en la base de datos
 * 7. Crea registro de auditoría con previousValues y newValues
 */
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

    // Guardar estado anterior para auditoría
    const previousValues = promotion.toObject();

    // Lista de campos permitidos para actualizar (protege campos críticos)
    const allowedFields = [
      'name', 'description', 'minDepositAmount', 'maxDepositAmount',
      'minTransferAmount', 'maxTransferAmount', 'minConsecutiveTransactions',
      'minAccountBalance', 'discountPercentage', 'cashbackPercentage',
      'cashbackAmount', 'bonusPoints', 'maxUsesPerClient', 'maxUsesTotalPromotion',
      'startDate', 'endDate', 'daysOfWeekApplicable', 'isExclusive', 'notes'
    ];

    // Actualizar solo campos permitidos y rastrear cuáles cambiaron
    let changedFields = [];
    const updatePayload = {};
    
    allowedFields.forEach((field) => {
      if (updateData.hasOwnProperty(field)) {
        updatePayload[field] = updateData[field];
        changedFields.push(field);
      }
    });

    updatePayload.updatedBy = adminUserId; // Registrar quién actualizó

    const updatedPromotion = await Catalog.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true, runValidators: true }
    );

    // Registrar en auditoría (solo si hubo cambios)
    if (changedFields.length > 0) {
      await createCatalogAudit({
        catalogId: updatedPromotion._id,
        action: 'ACTUALIZAR',
        actorUserId: adminUserId,
        previousValues, // Estado anterior completo
        newValues: updatedPromotion.toObject(), // Estado nuevo completo
        changedFields, // Solo nombres de campos modificados
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

/**
 * updatePromotionStatus
 * Endpoint: PUT /catalog/admin/:id/status
 * Acceso: Solo Admin
 * 
 * Propósito:
 * Cambia el estado operativo de una promoción (activar, pausar, desactivar, expirar).
 * Útil para control ágil sin tener que hacer un update completo.
 * 
 * Lógica:
 * 1. Valida que newStatus sea uno de los valores permitidos
 * 2. Busca la promoción por ID
 * 3. Guarda el estado anterior
 * 4. Cambia el estado y registra updatedBy
 * 5. Mapea el nuevo estado a una acción de auditoría:
 *    - INACTIVA → DESACTIVAR
 *    - PAUSADA → PAUSAR
 *    - ACTIVA → REACTIVAR
 *    - Otros → ACTUALIZAR
 * 6. Registra la acción en auditoría
 */
export const updatePromotionStatus = async (req, res) => {
  try {
    const adminUserId = req.user?.id;
    const { id } = req.params;
    const { newStatus, reason } = req.body;

    const validStatuses = ['ACTIVA', 'INACTIVA', 'PAUSADA', 'EXPIRADA'];

    // Validar que el estado sea válido
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
    
    // Actualizar estado y quién lo actualizó
    const updatedPromotion = await Catalog.findByIdAndUpdate(
      id,
      { status: newStatus, updatedBy: adminUserId },
      { new: true, runValidators: true }
    );

    // Mapear estado a acción de auditoría específica
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

/**
 * getPromotionAudit
 * Endpoint: GET /catalog/admin/:id/audit
 * Acceso: Solo Admin
 * 
 * Propósito:
 * Retorna el historial completo de cambios de una promoción específica.
 * Permite rastrear quién modificó qué, cuándo y por qué en una promoción.
 * 
 * Lógica:
 * 1. Busca todos los registros de auditoría donde catalogId = id
 * 2. Ordena cronológicamente descendente (más recientes primero)
 * 3. Retorna todos los campos de auditoría:
 *    - action: tipo de cambio
 *    - actorUserId: quién lo hizo
 *    - previousValues/newValues: qué cambió
 *    - changedFields: campos modificados
 *    - reason: justificación
 *    - ipAddress, userAgent: contexto técnico
 *    - createdAt: cuándo ocurrió
 */
export const getPromotionAudit = async (req, res) => {
  try {
    const { id } = req.params;

    const auditRecords = await CatalogAudit.find({ catalogId: id })
      .sort({ createdAt: -1 }); // Más recientes primero

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
 * getAllAudit
 * Endpoint: GET /catalog/admin/audit/all
 * Acceso: Solo Admin
 * 
 * Propósito:
 * Retorna la auditoría global de TODAS las promociones con paginación.
 * Útil para supervisión general y reportes de actividad administrativa.
 * 
 * Lógica:
 * 1. Construye filtros dinámicos según parámetros
 * 2. Usa findAndCountAll para obtener total y registros
 * 3. Limita resultados a máximo 100 por petición (performance)
 * 4. Ordena cronológicamente descendente
 * 5. Retorna total, límite, offset y datos
 */
export const getAllAudit = async (req, res) => {
  try {
    const { action, actorUserId, limit = 50, offset = 0 } = req.query;

    let query = {};

    // Filtro por tipo de acción
    if (action) {
      query.action = action.toUpperCase();
    }

    // Filtro por administrador específico
    if (actorUserId) {
      query.actorUserId = actorUserId;
    }

    // Consulta con conteo total para paginación
    const count = await CatalogAudit.countDocuments(query);
    const limitValue = Math.min(parseInt(limit), 100); // Máximo 100 registros por petición
    const offsetValue = parseInt(offset);

    const rows = await CatalogAudit.find(query)
      .sort({ createdAt: -1 })
      .limit(limitValue)
      .skip(offsetValue);

    return res.status(200).json({
      success: true,
      total: count, // Total de registros que cumplen el filtro
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

/**
 * deletePromotion
 * Endpoint: DELETE /catalog/admin/:id
 * Acceso: Solo Admin
 * 
 * Propósito:
 * Desactiva una promoción (soft delete).
 * No elimina físicamente el registro, solo cambia su estado a INACTIVA.
 * Esto preserva el historial y permite reactivar en el futuro si es necesario.
 * Lógica:
 * 1. Busca la promoción por ID
 * 2. Guarda el estado anterior
 * 3. Cambia status a 'INACTIVA' (soft delete)
 * 4. Registra updatedBy con el ID del admin
 * 5. Guarda los cambios
 * 6. Crea registro de auditoría con acción DESACTIVAR
 * 7. Captura IP, User-Agent y razón del cambio
 * 
 * Nota: No se usa destrucción física (.destroy()) para preservar datos históricos.
 * 
 */
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
    
    // Soft delete: cambiar estado en lugar de eliminar físicamente
    const updatedPromotion = await Catalog.findByIdAndUpdate(
      id,
      { status: 'INACTIVA', updatedBy: adminUserId },
      { new: true, runValidators: true }
    );

    // Registrar acción de desactivación en auditoría
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
