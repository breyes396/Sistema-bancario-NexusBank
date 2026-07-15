import express from 'express';
import {
  createReversalRequest,
  listMyReversalRequests,
  listReversalRequestsForAdmin,
  approveReversalRequest,
  rejectReversalRequest
} from './reversal.controller.js';
import { verifyTokenAndGetUser, verifyRoles } from '../../middlewares/role-middleware.js';

const router = express.Router();

router.post('/accounts/reversal-requests', verifyTokenAndGetUser, verifyRoles(['Client']), createReversalRequest);
router.get('/accounts/reversal-requests', verifyTokenAndGetUser, verifyRoles(['Client']), listMyReversalRequests);

router.get('/admin/reversal-requests', verifyTokenAndGetUser, verifyRoles(['Admin']), listReversalRequestsForAdmin);
router.put('/admin/reversal-requests/:id/approve', verifyTokenAndGetUser, verifyRoles(['Admin']), approveReversalRequest);
router.put('/admin/reversal-requests/:id/reject', verifyTokenAndGetUser, verifyRoles(['Admin']), rejectReversalRequest);

export default router;
