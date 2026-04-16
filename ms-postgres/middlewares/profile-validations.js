import { body, validationResult } from 'express-validator';

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      msg: 'Errores de validación',
      errors: errors.array()
    });
  }
  next();
};

export const validateEditOwnProfile = [
  body('name')
    .optional({ nullable: true })
    .trim()
    .notEmpty()
    .withMessage('El nombre no puede estar vacío')
    .isLength({ min: 2, max: 80 })
    .withMessage('El nombre debe tener entre 2 y 80 caracteres'),
  body('fullName')
    .optional({ nullable: true })
    .trim()
    .notEmpty()
    .withMessage('El nombre completo no puede estar vacío')
    .isLength({ min: 2, max: 80 })
    .withMessage('El nombre completo debe tener entre 2 y 80 caracteres'),
  body('username')
    .optional({ nullable: true })
    .trim()
    .notEmpty()
    .withMessage('El nombre de usuario no puede estar vacío')
    .isLength({ min: 3, max: 30 })
    .withMessage('El nombre de usuario debe tener entre 3 y 30 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('El nombre de usuario solo puede contener letras, números y guion bajo'),
  body('address')
    .optional({ nullable: true })
    .trim()
    .notEmpty()
    .withMessage('La dirección no puede estar vacía')
    .isLength({ min: 5, max: 150 })
    .withMessage('La dirección debe tener entre 5 y 150 caracteres'),
  body('jobName')
    .optional({ nullable: true })
    .trim()
    .notEmpty()
    .withMessage('El nombre del trabajo no puede estar vacío')
    .isLength({ min: 2, max: 80 })
    .withMessage('El nombre del trabajo debe tener entre 2 y 80 caracteres'),
  body('income')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Los ingresos mensuales deben ser un número positivo'),
  body().custom((value) => {
    const editableFields = ['name', 'fullName', 'username', 'address', 'jobName', 'income'];
    const hasAtLeastOneField = editableFields.some((field) => value[field] !== undefined);

    if (!hasAtLeastOneField) {
      throw new Error('Debes enviar al menos un campo editable: nombre (name/fullName), nombre de usuario (username), dirección (address), nombre del trabajo (jobName) o ingresos mensuales (income)');
    }

    return true;
  }),
  handleValidationErrors
];
