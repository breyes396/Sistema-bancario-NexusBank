import express from 'express';
import { createDeposit } from '../controllers/deposit.controller.js';
import authMiddleware from '../middlewares/auth-middleware.js';

const router = express.Router();

router.post('/deposits', authMiddleware, createDeposit);

export default router;