import express from 'express';
import {
  createAccount,
  requestAccountWithoutToken,
  enableRequestedAccount,
  listAccounts,
  updateAccountLimits,
  convertAccountBalance,
  getAccountLimitsAdmin,
  updateAccountLimitsAdmin,
  getAdminAccountDetails,
  freezeAccount,
  unfreezeAccount,
  getAccountBlockHistory
} from './account.controller.js';
import { verifyTokenAndGetUser, verifyRoles } from '../../middlewares/role-middleware.js';
import { validateAccountType } from '../../middlewares/account-validators.js';


const router = express.Router();

router.post('/public/account-requests', validateAccountType, requestAccountWithoutToken);

router.get('/accounts', verifyTokenAndGetUser, verifyRoles(['Client', 'Employee', 'Admin']), listAccounts);

router.post('/accounts', verifyTokenAndGetUser, verifyRoles(['Admin']), validateAccountType, createAccount);

router.post('/admin/accounts/:id/enable', verifyTokenAndGetUser, verifyRoles(['Admin']), enableRequestedAccount);

router.put('/accounts/:id/limits', verifyTokenAndGetUser, verifyRoles(['Employee', 'Admin']), updateAccountLimits);

router.get('/accounts/:id/limits/admin', verifyTokenAndGetUser, verifyRoles(['Admin']), getAccountLimitsAdmin);

router.put('/accounts/:id/limits/admin', verifyTokenAndGetUser, verifyRoles(['Admin']), updateAccountLimitsAdmin);

router.get('/admin/accounts/:accountId/details', verifyTokenAndGetUser, verifyRoles(['Admin']), getAdminAccountDetails);

router.get('/my-account/balance/convert', verifyTokenAndGetUser, verifyRoles(['Client']), convertAccountBalance);

router.post('/admin/accounts/:id/freeze',
  verifyTokenAndGetUser,
  verifyRoles(['Admin']),
  freezeAccount
);

router.post('/admin/accounts/:id/unfreeze',
  verifyTokenAndGetUser,
  verifyRoles(['Admin']),
  unfreezeAccount
);

router.get('/admin/accounts/:id/block-history',
  verifyTokenAndGetUser,
  verifyRoles(['Admin']),
  getAccountBlockHistory
);

export default router;
