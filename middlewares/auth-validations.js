import { body, validationResult } from 'express-validator';

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      msg: 'Errores de validacion',
      errors: errors.array()
    });
  }
  next();
};

const strongPasswordValidator = body('password')
  .isLength({ min: 8 })
  .withMessage('Password debe tener minimo 8 caracteres')
  .matches(/[A-Z]/)
  .withMessage('Password debe contener al menos una mayuscula')
  .matches(/[a-z]/)
  .withMessage('Password debe contener al menos una minuscula')
  .matches(/[0-9]/)
  .withMessage('Password debe contener al menos un numero')
  .matches(/[@$!%*?&#]/)
  .withMessage('Password debe contener al menos un simbolo (@$!%*?&#)');

const strongPasswordValidatorNewPassword = body('newPassword')
  .isLength({ min: 8 })
  .withMessage('Password debe tener minimo 8 caracteres')
  .matches(/[A-Z]/)
  .withMessage('Password debe contener al menos una mayuscula')
  .matches(/[a-z]/)
  .withMessage('Password debe contener al menos una minuscula')
  .matches(/[0-9]/)
  .withMessage('Password debe contener al menos un numero')
  .matches(/[@$!%*?&#]/)
  .withMessage('Password debe contener al menos un simbolo (@$!%*?&#)');

export const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Email invalido')
    .normalizeEmail(),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Nombre es requerido')
    .isLength({ min: 2, max: 50 })
    .withMessage('Nombre debe tener entre 2 y 50 caracteres'),
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username es requerido')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username debe tener entre 3 y 30 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username solo puede contener letras, numeros y guion bajo'),
  strongPasswordValidator,
  body('phoneNumber')
    .trim()
    .notEmpty()
    .withMessage('Telefono es requerido')
    .isLength({ min: 8, max: 8 })
    .withMessage('Telefono debe tener 8 digitos')
    .isNumeric()
    .withMessage('Telefono solo puede contener numeros'),
  body('documentNumber')
    .optional()
    .trim()
    .isLength({ min: 13, max: 13 })
    .withMessage('DPI debe tener 13 digitos')
    .isNumeric()
    .withMessage('DPI solo puede contener numeros'),
  body('income')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Ingreso debe ser un numero positivo'),
  handleValidationErrors
];

export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Email invalido')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password es requerido'),
  handleValidationErrors
];

export const validateVerifyEmail = [
  body('token')
    .notEmpty()
    .withMessage('Token es requerido')
    .isLength({ min: 20 })
    .withMessage('Token invalido'),
  handleValidationErrors
];

export const validateResendVerification = [
  body('email')
    .isEmail()
    .withMessage('Email invalido')
    .normalizeEmail(),
  handleValidationErrors
];

export const validateForgotPassword = [
  body('email')
    .isEmail()
    .withMessage('Email invalido')
    .normalizeEmail(),
  handleValidationErrors
];

export const validateResetPassword = [
  body('token')
    .notEmpty()
    .withMessage('Token es requerido')
    .isLength({ min: 20 })
    .withMessage('Token invalido'),
  strongPasswordValidatorNewPassword,
  handleValidationErrors
];
