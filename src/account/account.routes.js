import express from 'express';
import { createAccount, listAccounts, updateAccountLimits, convertAccountBalance, createDepositRequest, approveDepositRequest, revertDeposit, createTransfer, getAccountLimitsAdmin, updateAccountLimitsAdmin, getAdminAccountDetails, getMyAccountHistory, getDashboardTransactionRanking } from './account.controller.js';
import { verifyTokenAndGetUser, verifyRoles } from '../../middlewares/role-middleware.js';

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

router.post('/accounts/deposit-requests', verifyTokenAndGetUser, verifyRoles(['Client']), createDepositRequest);

router.put('/accounts/deposit-requests/:id/approve', verifyTokenAndGetUser, verifyRoles(['Employee', 'Admin']), approveDepositRequest);

router.put('/accounts/deposit-requests/:id/revert', verifyTokenAndGetUser, verifyRoles(['Employee', 'Admin']), revertDeposit);

router.post('/accounts/transfers', verifyTokenAndGetUser, verifyRoles(['Client']), createTransfer);

export default router;
