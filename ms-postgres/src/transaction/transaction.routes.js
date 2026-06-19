import express from 'express';
import {
  createTransfer,
  revertTransfer,
  getTransferById,
  getMyAccountHistory,
  getMyTransactions,
  getAdminTransactions,
  getEmployeeAccountTransactions,
  getDashboardTransactionRanking
} from './transaction.controller.js';
import { verifyTokenAndGetUser, verifyRoles } from '../../middlewares/role-middleware.js';
import { transferLimiter, globalTransactionLimiter } from '../../middlewares/rate-limiters.js';
import { validateClientTransactionsQuery, validateAdminTransactionsQuery, validateEmployeeAccountTransactions } from '../../middlewares/transaction-validations.js';

const router = express.Router();

router.get('/dashboard/transaction-ranking', verifyTokenAndGetUser, verifyRoles(['Admin']), getDashboardTransactionRanking);

router.post('/accounts/transfers',
  verifyTokenAndGetUser,
  globalTransactionLimiter,
  transferLimiter,
  verifyRoles(['Client']),
  createTransfer
);

router.get('/accounts/transfers/:transferId', verifyTokenAndGetUser, verifyRoles(['Client']), getTransferById);

router.put('/accounts/transfers/:id/revert', verifyTokenAndGetUser, verifyRoles(['Client', 'Admin']), revertTransfer);

router.get('/my-account/history', verifyTokenAndGetUser, verifyRoles(['Client', 'Employee']), getMyAccountHistory);
router.get('/client/transactions', verifyTokenAndGetUser, verifyRoles(['Client', 'Employee']), validateClientTransactionsQuery, getMyTransactions);
router.get('/admin/transactions', verifyTokenAndGetUser, verifyRoles(['Admin', 'Employee']), validateAdminTransactionsQuery, getAdminTransactions);
router.get('/employee/accounts/:accountId/transactions', verifyTokenAndGetUser, verifyRoles(['Employee']), validateEmployeeAccountTransactions, getEmployeeAccountTransactions);

export default router;
