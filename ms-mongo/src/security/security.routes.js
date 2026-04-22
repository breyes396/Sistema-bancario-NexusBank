import express from 'express';
import { verifyTokenAndGetUser, verifyRoles } from '../../middlewares/role-middleware.js';
import { getUserSecurityStatus, getFailedAttempts, getFraudAlerts } from './security.controller.js';

const router = express.Router();

router.get('/security/status', verifyTokenAndGetUser, verifyRoles(['Client']), getUserSecurityStatus);
router.get('/security/failed-attempts', verifyTokenAndGetUser, verifyRoles(['Client']), getFailedAttempts);
router.get('/security/fraud-alerts', verifyTokenAndGetUser, verifyRoles(['Client']), getFraudAlerts);

export default router;
