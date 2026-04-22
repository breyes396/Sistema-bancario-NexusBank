'use strict';

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const parseNumber = (value) => {

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null; 
};

const isValidPromotionId = (id) => {
  if (!id || typeof id !== 'string') return false;
  const pattern = /^cat_[123456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz]{12}$/;
  return pattern.test(id);
};

const respondValidationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: 'Validación fallida',
    errors
  });
};

const VALID_PROMOTION_TYPES = [
  'DEPOSITO_CASHBACK',
  'TRANSFERENCIA_DESCUENTO',
  'TRANSFERENCIA_PROPIA_BONUS',
  'TRANSACCIONES_FRECUENTES',
  'SALDO_MINIMO_REWARD',
  'APERTURA_CUENTA_BONUS'
];

const VALID_STATUSES = ['ACTIVA', 'INACTIVA', 'PAUSADA', 'EXPIRADA'];

export const validateCreatePromotion = (req, res, next) => {
  const errors = [];
  const { name, promotionType, startDate, endDate, description } = req.body;

  if (!isNonEmptyString(name)) {
    errors.push('El nombre de la promoción es requerido');
  } else if (name.trim().length > 100) {
    errors.push('El nombre no puede exceder 100 caracteres');
  } else {
    req.body.name = name.trim(); 
  }

  if (!isNonEmptyString(promotionType)) {
    errors.push('El tipo de promoción es requerido');
  } else {
    const normalizedType = promotionType.toUpperCase();
    if (!VALID_PROMOTION_TYPES.includes(normalizedType)) {
      errors.push(`Tipo de promoción inválido. Válidos: ${VALID_PROMOTION_TYPES.join(', ')}`);
    } else {
      req.body.promotionType = normalizedType; 
    }
  }

  if (description && typeof description !== 'string') {
    errors.push('La descripción debe ser texto');
  } else if (description) {
    req.body.description = description.trim();
  }

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

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      errors.push('La fecha de fin debe ser posterior a la fecha de inicio');
    }
  }

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
        req.body[field] = parsed; 
      }
    }
  });

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

  if (req.body.hasOwnProperty('cashbackAmount') && req.body.cashbackAmount !== null && req.body.cashbackAmount !== undefined) {
    const parsed = parseNumber(req.body.cashbackAmount);
    if (parsed === null || parsed < 0) {
      errors.push('cashbackAmount debe ser un número no negativo');
    } else {
      req.body.cashbackAmount = parsed;
    }
  }

  if (req.body.hasOwnProperty('bonusPoints') && req.body.bonusPoints !== null && req.body.bonusPoints !== undefined) {
    const parsed = parseInt(req.body.bonusPoints, 10);
    if (!Number.isInteger(parsed) || parsed < 0) {
      errors.push('bonusPoints debe ser un entero no negativo');
    } else {
      req.body.bonusPoints = parsed;
    }
  }

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

  if (errors.length > 0) {
    return respondValidationError(res, errors);
  }

  return next();
};

export const validateUpdatePromotion = (req, res, next) => {
  const errors = [];
  
  const allowedFields = [
    'name', 'description', 'minDepositAmount', 'maxDepositAmount',
    'minTransferAmount', 'maxTransferAmount', 'minConsecutiveTransactions',
    'minAccountBalance', 'discountPercentage', 'cashbackPercentage',
    'cashbackAmount', 'bonusPoints', 'maxUsesPerClient', 'maxUsesTotalPromotion',
    'startDate', 'endDate', 'daysOfWeekApplicable', 'isExclusive', 'notes', 'reason'
  ];

  const receivedFields = Object.keys(req.body || {});
  const unknownFields = receivedFields.filter((field) => !allowedFields.includes(field));

  if (unknownFields.length > 0) {
    errors.push(`Campos no permitidos: ${unknownFields.join(', ')}`);
  }

  if (receivedFields.length === 0) {
    errors.push('Debe enviar al menos un campo para actualizar');
  }

  if (req.body.hasOwnProperty('name') && req.body.name) {
    if (!isNonEmptyString(req.body.name)) {
      errors.push('El nombre debe ser texto no vacío');
    } else if (req.body.name.trim().length > 100) {
      errors.push('El nombre no puede exceder 100 caracteres');
    } else {
      req.body.name = req.body.name.trim();
    }
  }

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

export const validatePromotionId = (req, res, next) => {
  const { id } = req.params;

  if (!isValidPromotionId(id)) {
    return respondValidationError(res, ['ID de promoción inválido']);
  }

  return next();
};

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
