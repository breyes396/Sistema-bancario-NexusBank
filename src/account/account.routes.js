import express from 'express';
import { createAccount, listAccounts, updateAccountLimits, convertAccountBalance, createDepositRequest, updateDepositRequestAmount, approveDepositRequest, revertDeposit, createTransfer, revertTransfer, getAccountLimitsAdmin, updateAccountLimitsAdmin, getAdminAccountDetails, getMyAccountHistory, getMyTransactions, getAdminTransactions, getEmployeeAccountTransactions, getDashboardTransactionRanking, getUserSecurityStatus, getFailedAttempts, getFraudAlerts, freezeAccount, unfreezeAccount, getAccountBlockHistory } from './account.controller.js';
import { verifyTokenAndGetUser, verifyRoles } from '../../middlewares/role-middleware.js';
import { transferLimiter, depositLimiter, failedTransactionLimiter, withdrawalLimiter, globalTransactionLimiter } from '../../middlewares/rate-limiters.js';
import { validateClientTransactionsQuery, validateAdminTransactionsQuery, validateEmployeeAccountTransactions } from '../../middlewares/transaction-validations.js';
import { validateAccountType } from '../../middlewares/account-validators.js';


const router = express.Router();

router.get('/accounts', verifyTokenAndGetUser, verifyRoles(['Client', 'Employee', 'Admin']), listAccounts);

router.post('/accounts', verifyTokenAndGetUser, verifyRoles(['Admin']), validateAccountType, createAccount);

router.put('/accounts/:id/limits', verifyTokenAndGetUser, verifyRoles(['Employee', 'Admin']), updateAccountLimits);

router.get('/accounts/:id/limits/admin', verifyTokenAndGetUser, verifyRoles(['Admin']), getAccountLimitsAdmin);

router.put('/accounts/:id/limits/admin', verifyTokenAndGetUser, verifyRoles(['Admin']), updateAccountLimitsAdmin);

router.get('/admin/accounts/:accountId/details', verifyTokenAndGetUser, verifyRoles(['Admin']), getAdminAccountDetails);

router.get('/dashboard/transaction-ranking', verifyTokenAndGetUser, verifyRoles(['Admin']), getDashboardTransactionRanking);

router.get('/my-account/balance/convert', verifyTokenAndGetUser, verifyRoles(['Client']), convertAccountBalance);

router.get('/my-account/history', verifyTokenAndGetUser, verifyRoles(['Client']), getMyAccountHistory);


router.post('/accounts/deposit-requests', 
  verifyTokenAndGetUser, 
  globalTransactionLimiter,
  depositLimiter,
  verifyRoles(['Client']), 
  createDepositRequest
);

router.get('/client/transactions', verifyTokenAndGetUser, verifyRoles(['Client']), validateClientTransactionsQuery, getMyTransactions);

router.get('/admin/transactions', verifyTokenAndGetUser, verifyRoles(['Admin']), validateAdminTransactionsQuery, getAdminTransactions);

router.get('/employee/accounts/:accountId/transactions', verifyTokenAndGetUser, verifyRoles(['Employee']), validateEmployeeAccountTransactions, getEmployeeAccountTransactions);

router.put('/accounts/deposit-requests/:id/amount', verifyTokenAndGetUser, verifyRoles(['Employee', 'Admin']), updateDepositRequestAmount);

router.put('/accounts/deposit-requests/:id/approve', verifyTokenAndGetUser, verifyRoles(['Employee', 'Admin']), approveDepositRequest);

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

router.put('/accounts/transfers/:id/revert', 
  verifyTokenAndGetUser, 
  verifyRoles(['Client']), 
  revertTransfer
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

// ====== ENDPOINTS DE BLOQUEO/DESBLOQUEO DE CUENTAS (T46) ======

// Congelar cuenta (Admin only)
router.post('/admin/accounts/:id/freeze',
  verifyTokenAndGetUser,
  verifyRoles(['Admin']),
  freezeAccount
);

// Descongelar/Rehabilitar cuenta (Admin only)
router.post('/admin/accounts/:id/unfreeze',
  verifyTokenAndGetUser,
  verifyRoles(['Admin']),
  unfreezeAccount
);

// Obtener historial de bloqueos (Admin only)
router.get('/admin/accounts/:id/block-history',
  verifyTokenAndGetUser,
  verifyRoles(['Admin']),
  getAccountBlockHistory
);

export default router;
