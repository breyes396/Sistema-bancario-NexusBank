import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: {
    success: false,
    msg: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

export const registerLimiter = rateLimit({
  windowMs: 10 * 1000, 
  max: 5, 
  message: {
    success: false,
    msg: 'Demasiados registros desde esta IP. Intenta de nuevo en 10 segundos'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 3, 
  message: {
    success: false,
    msg: 'Demasiados intentos de recuperacion. Intenta de nuevo en 1 hora'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const verifyEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 10, 
  message: {
    success: false,
    msg: 'Demasiados intentos de verificacion. Intenta de nuevo en 1 hora'
  },
  standardHeaders: true,
  legacyHeaders: false
});
// ====== RATE LIMITERS PARA OPERACIONES MONETARIAS ======

// Transferencias: 10 intentos por hora por usuario
export const transferLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 10, 
  message: {
    success: false,
    msg: 'Has excedido el límite de transferencias. Intenta de nuevo en 1 hora'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req), // Limita por usuario, no por IP
  skip: (req) => !req.user // Solo aplica si está autenticado
});

// Depósitos: 15 intentos por hora por usuario
export const depositLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 15, 
  message: {
    success: false,
    msg: 'Has excedido el límite de solicitudes de depósito. Intenta de nuevo en 1 hora'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req),
  skip: (req) => !req.user
});

// Operaciones monetarias fallidas: 5 intentos fallidos por 30 minutos
export const failedTransactionLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, 
  max: 5, 
  message: {
    success: false,
    msg: 'Múltiples intentos fallidos. Tu cuenta ha sido bloqueada temporalmente por 30 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req),
  skip: (req) => !req.user,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      msg: 'Cuenta bloqueada temporalmente por múltiples intentos fallidos',
      retryAfter: 30
    });
  }
});

// Límite estricto para retiros: 5 intentos por 2 horas
export const withdrawalLimiter = rateLimit({
  windowMs: 2 * 60 * 60 * 1000, 
  max: 5, 
  message: {
    success: false,
    msg: 'Has excedido el límite de retiros. Intenta de nuevo en 2 horas'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req),
  skip: (req) => !req.user
});

// Rate limiter global para todas las operaciones monetarias (IP basado)
export const globalTransactionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    msg: 'Demasiadas operaciones desde esta ubicación. Intenta de nuevo en 10 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.user?.role === 'Admin' // Los admins no están limitados
});