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
  deletePromotion,
  getActiveAutomaticPromotion,
  validateAndApplyCoupon
} from './catalog.controller.js';
import {
  validateCreatePromotion,
  validateUpdatePromotion,
  validatePromotionId,
  validateStatusChange
} from '../../middlewares/promotion-validators.js';
import { verifyTokenAndGetUser, verifyRoles } from '../../middlewares/role-middleware.js';

const router = express.Router();

router.get('/internal/active-promotion/:operationType', getActiveAutomaticPromotion);

router.post('/internal/validate-coupon', async (req, res) => {
  try {
    const { couponId, operationType, amount } = req.body;
    const validationResult = await validateAndApplyCoupon(couponId, operationType, amount);
    
    return res.status(validationResult.valid ? 200 : 400).json({
      success: validationResult.valid,
      ...validationResult
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

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
