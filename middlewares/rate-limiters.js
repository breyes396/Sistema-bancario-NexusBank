import rateLimit from 'express-rate-limit';

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
