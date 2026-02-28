<<<<<<< HEAD

const express = require('express');
const router = express.Router();
const authCtrl = require('./auth.controller');

// Login (cliente o admin)
router.post('/login', authCtrl.login);

// Registro de cliente
router.post('/register', authCtrl.register);

module.exports = router;
=======
import express from 'express';
import {
	login,
	register,
	verifyEmail,
	resendVerification,
	forgotPassword,
	resetPassword,
	getProfile
} from './auth.controller.js';
import {
  validateLogin,
  validateRegister,
  validateResendVerification,
  validateForgotPassword,
  validateResetPassword
} from '../../middlewares/auth-validations.js';
import {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  verifyEmailLimiter
} from '../../middlewares/rate-limiters.js';
import { validateBearerToken } from '../../middlewares/auth-middleware.js';
import { verifyRoles } from '../../middlewares/role-middleware.js';

const router = express.Router();

router.post('/login', loginLimiter, validateLogin, login);

router.post('/register', validateBearerToken, verifyRoles(['Admin', 'Employee']), registerLimiter, validateRegister, register);

router.post('/verify-email', verifyEmailLimiter, verifyEmail);

router.get('/verify-email', verifyEmailLimiter, verifyEmail);

router.post('/resend-verification', verifyEmailLimiter, validateResendVerification, resendVerification);

router.post('/forgot-password', forgotPasswordLimiter, validateForgotPassword, forgotPassword);

router.post('/reset-password', validateResetPassword, resetPassword);

router.get('/profile', validateBearerToken, getProfile);

export default router;
>>>>>>> 617c0ff7ecaad94375311acd0c54da979f1bb189
