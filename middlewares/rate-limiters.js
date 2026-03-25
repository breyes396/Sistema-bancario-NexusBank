import rateLimit, { ipKeyGenerator } from 'express-rate-limit';



export const loginLimiter = (req, res, next) => next();
export const registerLimiter = (req, res, next) => next();
export const forgotPasswordLimiter = (req, res, next) => next();
export const verifyEmailLimiter = (req, res, next) => next();
export const transferLimiter = (req, res, next) => next();
export const depositLimiter = (req, res, next) => next();
export const failedTransactionLimiter = (req, res, next) => next();
export const withdrawalLimiter = (req, res, next) => next();
export const globalTransactionLimiter = (req, res, next) => next();