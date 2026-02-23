import express from 'express';
import { createTransfer } from '../controllers/transfer.controller.js';
import authMiddleware from '../middlewares/auth-middleware.js';

const router = express.Router();

router.post('/transfers', authMiddleware, createTransfer);

export default router