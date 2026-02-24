// ...existing code...
import { Router } from 'express';
import { createTransfer } from './transfer.controller.js';
import { verifyTokenAndGetUser, verifyIsClient } from '../../middlewares/role-middleware.js';

const router = Router();

// POST /nexusBank/v1/transfers
router.post(
    '/transfers',
    verifyTokenAndGetUser,
    verifyIsClient,
    createTransfer
);

export default router;
// ...existing code...