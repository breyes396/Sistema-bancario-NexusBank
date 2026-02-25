import { Router } from 'express';
import { getAccountDetails } from './admin.controller.js';
import { verifyTokenAndGetUser, verifyIsAdmin } from '../../middlewares/role-middleware.js';

const router = Router();

// GET /nexusBank/v1/admin/accounts/:accountId/details
router.get('/accounts/:accountId/details', verifyTokenAndGetUser, verifyIsAdmin, getAccountDetails);

export default router;
