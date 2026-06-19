import express from 'express';
import {
  createDepositRequest,
  updateDepositRequestAmount,
  approveDepositRequest,
  revertDeposit,
  getDepositRequests,
  getDepositRequestById
} from './deposit.controller.js';
import { verifyTokenAndGetUser, verifyRoles } from '../../middlewares/role-middleware.js';
import { depositLimiter, globalTransactionLimiter } from '../../middlewares/rate-limiters.js';

const router = express.Router();

router.get('/accounts/deposit-requests', verifyTokenAndGetUser, verifyRoles(['Employee', 'Admin']), getDepositRequests);
router.get('/accounts/deposit-requests/:depositId', verifyTokenAndGetUser, verifyRoles(['Employee', 'Admin']), getDepositRequestById);

router.post('/accounts/deposit-requests',
  verifyTokenAndGetUser,
  globalTransactionLimiter,
  depositLimiter,
  verifyRoles(['Client']),
  createDepositRequest
);

router.put('/accounts/deposit-requests/:id/amount', verifyTokenAndGetUser, verifyRoles(['Employee', 'Admin']), updateDepositRequestAmount);
router.put('/accounts/deposit-requests/:id/approve', verifyTokenAndGetUser, verifyRoles(['Employee', 'Admin']), approveDepositRequest);
router.put('/accounts/deposit-requests/:id/revert', verifyTokenAndGetUser, verifyRoles(['Employee', 'Admin']), revertDeposit);

export default router;
