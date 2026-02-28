'use strict';

/**
 * VALIDADORES DE PROMOCIONES - MIDDLEWARE DE VALIDACIÓN
 * 
 * Este middleware valida los datos de entrada para todas las operaciones del catálogo de promociones.
 * Asegura integridad de datos antes de que lleguen al controlador, previniendo errores de base de datos.
 * 
 * Funciones principales:
 * - validateCreatePromotion: Valida todos los campos al crear una promoción
 * - validateUpdatePromotion: Valida campos permitidos al actualizar una promoción
 * - validatePromotionId: Verifica formato del ID de promoción (cat_XXXXXXXXXXXX)
 * - validateStatusChange: Valida que el nuevo estado sea uno de los valores permitidos
 * 
 * Estrategia de validación:
 * 1. Parseo y normalización de datos (trim strings, convertir números)
 * 2. Validación de tipo de dato (string, number, date)
 * 3. Validación de rango (min/max, 0-100 para porcentajes)
 * 4. Validación de lógica de negocio (endDate > startDate)
 * 5. Acumulación de errores y respuesta única con todos los errores
 */

// ============= FUNCIONES AUXILIARES =============

/**
 * isNonEmptyString
 * Verifica que un valor sea un string no vacío después de trim.
 * @param {any} value - Valor a verificar
 * @returns {boolean} - true si es string con contenido, false en caso contrario
 */
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

/**
 * parseNumber
 * Convierte un valor a número, manejando tanto números como strings numéricos.
 * Retorna null si el valor no es parseable o no es finito.
 * 
 * @param {any} value - Valor a parsear (number, string o cualquier otro tipo)
 * @returns {number|null} - Número parseado o null si falla validación
 * 
 * Ejemplos:
 * parseNumber(123) → 123
 * parseNumber("456.78") → 456.78
 * parseNumber("abc") → null
 * parseNumber(Infinity) → null
 * parseNumber(null) → null
 */
const parseNumber = (value) => {
  // Si ya es número, verificar que sea finito (no NaN, Infinity, -Infinity)
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  // Si es string, intentar convertir a número
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null; // Cualquier otro tipo retorna null
};

/**
 * isValidPromotionId
 * Valida que un ID de promoción tenga el formato correcto.
 * Formato esperado: cat_XXXXXXXXXXXX donde X es base58 (excluye 0OIl)
 * 
 * @param {string} id - ID a validar
 * @returns {boolean} - true si cumple el formato, false en caso contrario
 * 
 * Patrón regex:
 * - Empieza con 'cat_'
 * - Seguido de exactamente 12 caracteres base58
 * - Base58: caracteres 123456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz
 * - Excluye 0 (cero), O (o mayúscula), I (i mayúscula), l (L minúscula) para evitar confusión
 * 
 * Ejemplo válido: cat_5HpxDvF3g8Kq
 * Ejemplo inválido: cat_123 (muy corto)
 * Ejemplo inválido: prm_5HpxDvF3g8Kq (prefijo incorrecto)
 */
const isValidPromotionId = (id) => {
  if (!id || typeof id !== 'string') return false;
  const pattern = /^cat_[123456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz]{12}$/;
  return pattern.test(id);
};

/**
 * respondValidationError
 * Función auxiliar que envía una respuesta de error de validación estandarizada.
 * Agrupa todos los errores en un solo array.
 * 
 * @param {Response} res - Objeto response de Express
 * @param {Array<string>} errors - Lista de mensajes de error
 * @returns {Response} - Response 400 con formato JSON estandarizado
 */
const respondValidationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: 'Validación fallida',
    errors
  });
};

// ============= CONSTANTES DE VALIDACIÓN =============

/**
 * Tipos de promoción válidos en el sistema.
 * Cada tipo representa una estrategia promocional específica:
 * - DEPOSITO_CASHBACK: Cashback por depósitos realizados
 * - TRANSFERENCIA_DESCUENTO: Descuento en comisión de transferencias a terceros
 * - TRANSFERENCIA_PROPIA_BONUS: Bonificación por transferencias entre cuentas propias
 * - TRANSACCIONES_FRECUENTES: Recompensa por realizar N transacciones consecutivas
 * - SALDO_MINIMO_REWARD: Beneficio por mantener saldo mínimo
 * - APERTURA_CUENTA_BONUS: Bonificación única por abrir cuenta nueva
 */
const VALID_PROMOTION_TYPES = [
  'DEPOSITO_CASHBACK',
  'TRANSFERENCIA_DESCUENTO',
  'TRANSFERENCIA_PROPIA_BONUS',
  'TRANSACCIONES_FRECUENTES',
  'SALDO_MINIMO_REWARD',
  'APERTURA_CUENTA_BONUS'
];

/**
 * Estados válidos para una promoción:
 * - ACTIVA: Promoción operativa y aplicable
 * - INACTIVA: Promoción desactivada (soft delete)
 * - PAUSADA: Promoción temporalmente suspendida
 * - EXPIRADA: Promoción que alcanzó su fecha de fin
 */
const VALID_STATUSES = ['ACTIVA', 'INACTIVA', 'PAUSADA', 'EXPIRADA'];

// ============= MIDDLEWARES VALIDADORES =============

/**
 * validateCreatePromotion
 * Middleware que valida el body de POST /catalog/admin/create
 * 
 * Validaciones realizadas:
 * 1. NOMBRE: requerido, string no vacío, máximo 100 caracteres
 * 2. TIPO DE PROMOCIÓN: requerido, debe estar en VALID_PROMOTION_TYPES
 * 3. DESCRIPCIÓN: opcional, si existe debe ser string
 * 4. FECHAS: formato válido, endDate > startDate
 * 5. MONTOS: números no negativos (minDepositAmount, maxDepositAmount, etc.)
 * 6. PORCENTAJES: entre 0 y 100 (discountPercentage, cashbackPercentage)
 * 7. CASHBACK AMOUNT: número no negativo
 * 8. BONUS POINTS: entero no negativo
 * 9. LÍMITES DE USO: enteros mayores a 0
 * 
 * Normalización automática:
 * - Strings: trim() para eliminar espacios al inicio/fin
 * - promotionType: convertido a uppercase
 * - Números: parseados desde strings si es necesario
 * 
 * Respuestas:
 * - next(): Si pasa todas las validaciones
 * - 400: Si hay errores (retorna array completo de errores)
 */
export const validateCreatePromotion = (req, res, next) => {
  const errors = [];
  const { name, promotionType, startDate, endDate, description } = req.body;

  // ===== VALIDAR NOMBRE =====
  if (!isNonEmptyString(name)) {
    errors.push('El nombre de la promoción es requerido');
  } else if (name.trim().length > 100) {
    errors.push('El nombre no puede exceder 100 caracteres');
  } else {
    req.body.name = name.trim(); // Normalizar: eliminar espacios
  }

  // ===== VALIDAR TIPO DE PROMOCIÓN =====
  if (!isNonEmptyString(promotionType)) {
    errors.push('El tipo de promoción es requerido');
  } else {
    const normalizedType = promotionType.toUpperCase();
    if (!VALID_PROMOTION_TYPES.includes(normalizedType)) {
      errors.push(`Tipo de promoción inválido. Válidos: ${VALID_PROMOTION_TYPES.join(', ')}`);
    } else {
      req.body.promotionType = normalizedType; // Normalizar a uppercase
    }
  }

  // ===== VALIDAR DESCRIPCIÓN =====
  if (description && typeof description !== 'string') {
    errors.push('La descripción debe ser texto');
  } else if (description) {
    req.body.description = description.trim();
  }

  // ===== VALIDAR FECHAS =====
  if (startDate) {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      errors.push('Fecha de inicio inválida');
    } else {
      req.body.startDate = startDate;
    }
  }

  if (endDate) {
    const end = new Date(endDate);
    if (isNaN(end.getTime())) {
      errors.push('Fecha de fin inválida');
    } else {
      req.body.endDate = endDate;
    }
  }

  // Validación de lógica: endDate debe ser después de startDate
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      errors.push('La fecha de fin debe ser posterior a la fecha de inicio');
    }
  }

  // ===== VALIDAR MONTOS (deben ser números no negativos) =====
  const amountFields = [
    'minDepositAmount', 'maxDepositAmount', 
    'minTransferAmount', 'maxTransferAmount', 
    'minAccountBalance'
  ];
  
  amountFields.forEach((field) => {
    if (req.body.hasOwnProperty(field) && req.body[field] !== null && req.body[field] !== undefined) {
      const parsed = parseNumber(req.body[field]);
      if (parsed === null || parsed < 0) {
        errors.push(`${field} debe ser un número no negativo`);
      } else {
        req.body[field] = parsed; // Normalizar a número
      }
    }
  });

  // ===== VALIDAR PORCENTAJES (deben estar entre 0 y 100) =====
  const percentageFields = ['discountPercentage', 'cashbackPercentage'];

  percentageFields.forEach((field) => {
    if (req.body.hasOwnProperty(field) && req.body[field] !== null && req.body[field] !== undefined) {
      const parsed = parseNumber(req.body[field]);
      if (parsed === null || parsed < 0 || parsed > 100) {
        errors.push(`${field} debe estar entre 0 y 100`);
      } else {
        req.body[field] = parsed;
      }
    }
  });

  // ===== VALIDAR CASHBACK AMOUNT =====
  if (req.body.hasOwnProperty('cashbackAmount') && req.body.cashbackAmount !== null && req.body.cashbackAmount !== undefined) {
    const parsed = parseNumber(req.body.cashbackAmount);
    if (parsed === null || parsed < 0) {
      errors.push('cashbackAmount debe ser un número no negativo');
    } else {
      req.body.cashbackAmount = parsed;
    }
  }

  // ===== VALIDAR PUNTOS DE BONIFICACIÓN =====
  if (req.body.hasOwnProperty('bonusPoints') && req.body.bonusPoints !== null && req.body.bonusPoints !== undefined) {
    const parsed = parseInt(req.body.bonusPoints, 10);
    if (!Number.isInteger(parsed) || parsed < 0) {
      errors.push('bonusPoints debe ser un entero no negativo');
    } else {
      req.body.bonusPoints = parsed;
    }
  }

  // ===== VALIDAR LÍMITES DE USO =====
  if (req.body.hasOwnProperty('maxUsesPerClient') && req.body.maxUsesPerClient !== null && req.body.maxUsesPerClient !== undefined) {
    const parsed = parseInt(req.body.maxUsesPerClient, 10);
    if (!Number.isInteger(parsed) || parsed < 1) {
      errors.push('maxUsesPerClient debe ser un entero mayor a 0');
    } else {
      req.body.maxUsesPerClient = parsed;
    }
  }

  if (req.body.hasOwnProperty('maxUsesTotalPromotion') && req.body.maxUsesTotalPromotion !== null && req.body.maxUsesTotalPromotion !== undefined) {
    const parsed = parseInt(req.body.maxUsesTotalPromotion, 10);
    if (!Number.isInteger(parsed) || parsed < 1) {
      errors.push('maxUsesTotalPromotion debe ser un entero mayor a 0');
    } else {
      req.body.maxUsesTotalPromotion = parsed;
    }
  }

  // Si hay errores, responder con 400
  if (errors.length > 0) {
    return respondValidationError(res, errors);
  }

  // Si todo está bien, pasar al siguiente middleware/controlador
  return next();
};

/**
 * validateUpdatePromotion
 * Middleware que valida el body de PUT /catalog/admin/:id
 * 
 * Diferencias con validateCreatePromotion:
 * - Ningún campo es obligatorio (puede actualizar solo algunos campos)
 * - Valida que se envíe al menos un campo
 * - Solo permite campos específicos (protección contra campos no deseados)
 * - Validaciones más permisivas (solo valida campos presentes)
 * 
 * Campos permitidos:
 * name, description, minDepositAmount, maxDepositAmount, minTransferAmount,
 * maxTransferAmount, minConsecutiveTransactions, minAccountBalance,
 * discountPercentage, cashbackPercentage, cashbackAmount, bonusPoints,
 * maxUsesPerClient, maxUsesTotalPromotion, startDate, endDate,
 * daysOfWeekApplicable, isExclusive, notes, reason
 * 
 * Validaciones:
 * - Rechaza campos no permitidos (fields not in allowedFields)
 * - Requiere al menos un campo para actualizar
 * - Aplica mismas validaciones de tipo/rango que create para campos presentes
 * 
 * Respuestas:
 * - next(): Si pasa todas las validaciones
 * - 400: Si hay errores o campos no permitidos
 */
export const validateUpdatePromotion = (req, res, next) => {
  const errors = [];
  
  // Lista blanca de campos actualizables (protege campos críticos)
  const allowedFields = [
    'name', 'description', 'minDepositAmount', 'maxDepositAmount',
    'minTransferAmount', 'maxTransferAmount', 'minConsecutiveTransactions',
    'minAccountBalance', 'discountPercentage', 'cashbackPercentage',
    'cashbackAmount', 'bonusPoints', 'maxUsesPerClient', 'maxUsesTotalPromotion',
    'startDate', 'endDate', 'daysOfWeekApplicable', 'isExclusive', 'notes', 'reason'
  ];

  const receivedFields = Object.keys(req.body || {});
  const unknownFields = receivedFields.filter((field) => !allowedFields.includes(field));

  // Error si envían campos no permitidos
  if (unknownFields.length > 0) {
    errors.push(`Campos no permitidos: ${unknownFields.join(', ')}`);
  }

  // Error si no envían ningún campo
  if (receivedFields.length === 0) {
    errors.push('Debe enviar al menos un campo para actualizar');
  }

  // ===== VALIDAR NOMBRE (solo si está presente) =====
  if (req.body.hasOwnProperty('name') && req.body.name) {
    if (!isNonEmptyString(req.body.name)) {
      errors.push('El nombre debe ser texto no vacío');
    } else if (req.body.name.trim().length > 100) {
      errors.push('El nombre no puede exceder 100 caracteres');
    } else {
      req.body.name = req.body.name.trim();
    }
  }

  // ===== VALIDAR PORCENTAJES (solo si están presentes) =====
  const percentageFields = ['discountPercentage', 'cashbackPercentage'];

  percentageFields.forEach((field) => {
    if (req.body.hasOwnProperty(field) && req.body[field] !== null && req.body[field] !== undefined) {
      const parsed = parseNumber(req.body[field]);
      if (parsed === null || parsed < 0 || parsed > 100) {
        errors.push(`${field} debe estar entre 0 y 100`);
      } else {
        req.body[field] = parsed;
      }
    }
  });

  // ===== VALIDAR MONTOS (solo si están presentes) =====
  const amountFields = [
    'minDepositAmount', 'maxDepositAmount', 
    'minTransferAmount', 'maxTransferAmount', 
    'minAccountBalance', 'cashbackAmount'
  ];
  
  amountFields.forEach((field) => {
    if (req.body.hasOwnProperty(field) && req.body[field] !== null && req.body[field] !== undefined) {
      const parsed = parseNumber(req.body[field]);
      if (parsed === null || parsed < 0) {
        errors.push(`${field} debe ser un número no negativo`);
      } else {
        req.body[field] = parsed;
      }
    }
  });

  if (errors.length > 0) {
    return respondValidationError(res, errors);
  }

  return next();
};

/**
 * validatePromotionId
 * Middleware que valida el parámetro :id en la URL
 * 
 * Propósito:
 * Verificar que el ID de promoción tenga el formato correcto antes de
 * buscar en la base de datos, evitando consultas inútiles.
 * 
 * Formato esperado: cat_[12 caracteres base58]
 * Ejemplo: cat_5HpxDvF3g8Kq
 * 
 * Respuestas:
 * - next(): Si el ID es válido
 * - 400: Si el ID tiene formato incorrecto
 */
export const validatePromotionId = (req, res, next) => {
  const { id } = req.params;

  if (!isValidPromotionId(id)) {
    return respondValidationError(res, ['ID de promoción inválido']);
  }

  return next();
};

/**
 * validateStatusChange
 * Middleware que valida el body de PUT /catalog/admin/:id/status
 * 
 * Propósito:
 * Asegurar que el nuevo estado sea uno de los valores válidos del sistema.
 * 
 * Validaciones:
 * - newStatus es requerido
 * - newStatus debe estar en VALID_STATUSES (ACTIVA, INACTIVA, PAUSADA, EXPIRADA)
 * 
 * Respuestas:
 * - next(): Si el estado es válido
 * - 400: Si el estado falta o es inválido
 */
export const validateStatusChange = (req, res, next) => {
  const errors = [];
  const { newStatus } = req.body;

  if (!newStatus) {
    errors.push('El nuevo estado es requerido');
  } else if (!VALID_STATUSES.includes(newStatus)) {
    errors.push(`Estado inválido. Válidos: ${VALID_STATUSES.join(', ')}`);
  }

  if (errors.length > 0) {
    return respondValidationError(res, errors);
  }

  return next();
};
