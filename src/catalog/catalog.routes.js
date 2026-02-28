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

// ============= RUTAS ADMIN (protegidas) - PRIMERO (más específicas) =============

/**
 * GET /nexusBank/v1/catalog/admin/all
 * Listar TODAS las promociones (Admin)
 */
router.get('/admin/all', verifyTokenAndGetUser, verifyRoles(['Admin']), getAllPromotionsAdmin);

/**
 * GET /nexusBank/v1/catalog/admin/audit/all
 * Ver auditoría global de todas las promociones (Admin)
 */
router.get('/admin/audit/all', verifyTokenAndGetUser, verifyRoles(['Admin']), getAllAudit);

/**
 * POST /nexusBank/v1/catalog/admin/create
 * Crear nueva promoción (Admin)
 */
router.post('/admin/create', verifyTokenAndGetUser, verifyRoles(['Admin']), validateCreatePromotion, createPromotion);

/**
 * GET /nexusBank/v1/catalog/admin/:id/audit
 * Ver historial de auditoría de una promoción (Admin)
 */
router.get('/admin/:id/audit', verifyTokenAndGetUser, verifyRoles(['Admin']), validatePromotionId, getPromotionAudit);

/**
 * PUT /nexusBank/v1/catalog/admin/:id/status
 * Cambiar estado de promoción (Admin)
 */
router.put('/admin/:id/status', verifyTokenAndGetUser, verifyRoles(['Admin']), validatePromotionId, validateStatusChange, updatePromotionStatus);

/**
 * PUT /nexusBank/v1/catalog/admin/:id
 * Actualizar promoción (Admin)
 */
router.put('/admin/:id', verifyTokenAndGetUser, verifyRoles(['Admin']), validatePromotionId, validateUpdatePromotion, updatePromotion);

/**
 * DELETE /nexusBank/v1/catalog/admin/:id
 * Eliminar/desactivar promoción (Admin)
 */
router.delete('/admin/:id', verifyTokenAndGetUser, verifyRoles(['Admin']), validatePromotionId, deletePromotion);

// ============= RUTAS PÚBLICAS (sin autenticación) - AL FINAL (menos específicas) =============

/**
 * GET /nexusBank/v1/catalog
 * Listar todas las promociones activas
 */
router.get('/', getAllPromotions);

/**
 * GET /nexusBank/v1/catalog/:id
 * Obtener detalles de una promoción específica
 */
router.get('/:id', validatePromotionId, getPromotionById);

export default router;
