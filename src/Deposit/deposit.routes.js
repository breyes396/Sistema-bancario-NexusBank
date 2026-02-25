
import express from 'express';
import { createDeposit, revertDeposit } from './deposit.controller.js';
import { verifyTokenAndGetUser, verifyIsClient, verifyRoles } from '../../middlewares/role-middleware.js';

const router = express.Router();

// POST /nexusBank/v1/deposits
router.post('/deposits', verifyTokenAndGetUser, verifyIsClient, createDeposit);

// PUT /nexusBank/v1/deposits/revert/:id
router.put('/deposits/revert/:id', verifyTokenAndGetUser, verifyRoles(['Admin']), revertDeposit);

export default router;