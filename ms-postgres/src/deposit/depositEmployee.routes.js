import express from 'express';
import {
  createDepositRequestByEmployee
} from './deposit.controller.js';
import { verifyTokenAndGetUser, verifyRoles } from '../../middlewares/role-middleware.js';
import { globalTransactionLimiter } from '../../middlewares/rate-limiters.js';

const router = express.Router();

// Endpoint para que empleados creen depósitos (nuevo endpoint, no afecta cliente)
router.post('/employee/deposits',
  verifyTokenAndGetUser,
  globalTransactionLimiter,
  verifyRoles(['Employee', 'Admin']),
  createDepositRequestByEmployee
);

export default router;
