'use strict';

import express from 'express';
import {
  getAllPromotions,
  getPromotionById,
  getAllPromotionsAdmin,
  createPromotion,
  updatePromotion,
  updatePromotionStatus,
  getPromotionAudit,
  getAllAudit,
  deletePromotion
} from './catalog.controller.js';
import {
  validateCreatePromotion,
  validateUpdatePromotion,
  validatePromotionId,
  validateStatusChange
} from '../../middlewares/promotion-validators.js';
import { verifyTokenAndGetUser, verifyRoles } from '../../middlewares/role-middleware.js';

const router = express.Router();

router.get('/admin/all', verifyTokenAndGetUser, verifyRoles(['Admin']), getAllPromotionsAdmin);

router.get('/admin/audit/all', verifyTokenAndGetUser, verifyRoles(['Admin']), getAllAudit);

router.post('/admin/create', verifyTokenAndGetUser, verifyRoles(['Admin']), validateCreatePromotion, createPromotion);

router.get('/admin/:id/audit', verifyTokenAndGetUser, verifyRoles(['Admin']), validatePromotionId, getPromotionAudit);

router.put('/admin/:id/status', verifyTokenAndGetUser, verifyRoles(['Admin']), validatePromotionId, validateStatusChange, updatePromotionStatus);

router.put('/admin/:id', verifyTokenAndGetUser, verifyRoles(['Admin']), validatePromotionId, validateUpdatePromotion, updatePromotion);

router.delete('/admin/:id', verifyTokenAndGetUser, verifyRoles(['Admin']), validatePromotionId, deletePromotion);

router.get('/', getAllPromotions);

router.get('/:id', validatePromotionId, getPromotionById);

export default router;
