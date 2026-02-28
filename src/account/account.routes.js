import express from 'express';
import { createAccount, listAccounts, updateAccountLimits, convertAccountBalance, createDepositRequest, approveDepositRequest, revertDeposit, createTransfer, getAccountLimitsAdmin, updateAccountLimitsAdmin, getAdminAccountDetails, getMyAccountHistory, getDashboardTransactionRanking, getUserSecurityStatus, getFailedAttempts, getFraudAlerts } from './account.controller.js';
import { verifyTokenAndGetUser, verifyRoles } from '../../middlewares/role-middleware.js';
import { transferLimiter, depositLimiter, failedTransactionLimiter, withdrawalLimiter, globalTransactionLimiter } from '../../middlewares/rate-limiters.js';

const router = express.Router();

router.get('/accounts', verifyTokenAndGetUser, verifyRoles(['Client', 'Employee', 'Admin']), listAccounts);

router.post('/accounts', verifyTokenAndGetUser, verifyRoles(['Client']), createAccount);

router.put('/accounts/:id/limits', verifyTokenAndGetUser, verifyRoles(['Employee', 'Admin']), updateAccountLimits);

router.get('/accounts/:id/limits/admin', verifyTokenAndGetUser, verifyRoles(['Admin']), getAccountLimitsAdmin);

router.put('/accounts/:id/limits/admin', verifyTokenAndGetUser, verifyRoles(['Admin']), updateAccountLimitsAdmin);

router.get('/admin/accounts/:accountId/details', verifyTokenAndGetUser, verifyRoles(['Admin']), getAdminAccountDetails);

router.get('/dashboard/transaction-ranking', verifyTokenAndGetUser, verifyRoles(['Admin']), getDashboardTransactionRanking);

router.get('/my-account/balance/convert', verifyTokenAndGetUser, verifyRoles(['Client']), convertAccountBalance);

router.get('/my-account/history', verifyTokenAndGetUser, verifyRoles(['Client']), getMyAccountHistory);

// ====== OPERACIONES MONETARIAS CON RATE LIMITING ======

// Depósitos
router.post('/accounts/deposit-requests', 
  verifyTokenAndGetUser, 
  globalTransactionLimiter,
  depositLimiter,
  verifyRoles(['Client']), 
  createDepositRequest
);

router.put('/accounts/deposit-requests/:id/approve', 
  verifyTokenAndGetUser, 
  verifyRoles(['Employee', 'Admin']), 
  approveDepositRequest
);

router.put('/accounts/deposit-requests/:id/revert', 
  verifyTokenAndGetUser, 
  verifyRoles(['Employee', 'Admin']), 
  revertDeposit
);

// Transferencias
router.post('/accounts/transfers', 
  verifyTokenAndGetUser,
  globalTransactionLimiter,
  transferLimiter,
  verifyRoles(['Client']), 
  createTransfer
);

// ====== ENDPOINTS DE SEGURIDAD Y ANTIFRAUDE ======

// Estado de seguridad de la cuenta
router.get('/security/status', 
  verifyTokenAndGetUser, 
  verifyRoles(['Client']), 
  getUserSecurityStatus
);

// Obtener intentos fallidos del usuario
router.get('/security/failed-attempts', 
  verifyTokenAndGetUser, 
  verifyRoles(['Client']), 
  getFailedAttempts
);

// Obtener alertas de fraude
router.get('/security/fraud-alerts', 
  verifyTokenAndGetUser, 
  verifyRoles(['Client']), 
  getFraudAlerts
);

export default router;
