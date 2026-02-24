
import express from 'express';
import { createDeposit } from '../controllers/deposit.controller.js';
import { verifyTokenAndGetUser, verifyIsClient } from '../../middlewares/role-middleware.js';

const router = express.Router();

// POST /nexusBank/v1/deposits
router.post('/deposits', verifyTokenAndGetUser, verifyIsClient, createDeposit);

export default router;