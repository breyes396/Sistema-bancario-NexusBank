'use strict';

/**
 * CATÁLOGO - RUTAS DE PROMOCIONES
 * 
 * Este archivo define todas las rutas HTTP para el sistema de promociones bancarias.
 * Organiza endpoints públicos y administrativos con sus respectivos middlewares de seguridad.
 * 
 * Base path: /nexusBank/v1/catalog
 * 
 * ORDEN CRÍTICO DE RUTAS:
 * En Express.js, las rutas se evalúan en el orden en que se declaran.
 * Las rutas más específicas DEBEN declararse ANTES que las genéricas.
 * 
 * Explicación del orden:
 * 1. Rutas ADMIN primero (/admin/all, /admin/create, /admin/:id)
 * 2. Rutas PÚBLICAS al final (/, /:id)
 * 
 * ¿Por qué este orden es importante?
 * Si declaráramos GET /:id antes de GET /admin/all, Express coincidiría
 * /admin/all con el patrón /:id, tratando "admin" como un ID de promoción.
 * Esto causaría error 404 en las rutas administrativas.
 * 
 * Ejemplo del problema:
 * - Orden incorrecto: GET /:id declarado primero → GET /admin/all es capturado por /:id
 * - Orden correcto: GET /admin/all declarado primero → funciona correctamente
 * 
 * Arquitectura de seguridad:
 * - Rutas admin: verifyTokenAndGetUser + verifyRoles(['Admin'])
 * - Rutas públicas: sin middlewares de autenticación
 * - Validaciones: promotion-validators para integridad de datos
 */

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
// Estas rutas requieren autenticación JWT y rol de Administrador.
// Se declaran primero para evitar que sean capturadas por rutas genéricas con parámetros.

/**
 * GET /nexusBank/v1/catalog/admin/all
 * 
 * Propósito: Listar TODAS las promociones sin filtros restrictivos (incluyendo inactivas)
 * Acceso: Solo Admin
 * Middlewares:
 * - verifyTokenAndGetUser: Valida JWT y obtiene datos del usuario
 * - verifyRoles(['Admin']): Verifica que el usuario tenga rol Admin
 * Query params opcionales: status, type, active
 */
router.get('/admin/all', verifyTokenAndGetUser, verifyRoles(['Admin']), getAllPromotionsAdmin);

/**
 * GET /nexusBank/v1/catalog/admin/audit/all
 * 
 * Propósito: Ver auditoría global de todas las promociones con paginación
 * Acceso: Solo Admin
 * Query params opcionales: action, actorUserId, limit, offset
 */
router.get('/admin/audit/all', verifyTokenAndGetUser, verifyRoles(['Admin']), getAllAudit);

/**
 * POST /nexusBank/v1/catalog/admin/create
 * 
 * Propósito: Crear una nueva promoción bancaria
 * Acceso: Solo Admin
 * Middlewares:
 * - validateCreatePromotion: Valida estructura y campos requeridos del body
 * Body requerido: name, promotionType, al menos un beneficio
 * Auditoría: Registra automáticamente la acción CREAR
 */
router.post('/admin/create', verifyTokenAndGetUser, verifyRoles(['Admin']), validateCreatePromotion, createPromotion);

/**
 * GET /nexusBank/v1/catalog/admin/:id/audit
 * 
 * Propósito: Ver historial completo de cambios de una promoción específica
 * Acceso: Solo Admin
 * Middlewares:
 * - validatePromotionId: Valida formato cat_XXXXXXXXXXXX
 * Params: id (ID de la promoción)
 */
router.get('/admin/:id/audit', verifyTokenAndGetUser, verifyRoles(['Admin']), validatePromotionId, getPromotionAudit);

/**
 * PUT /nexusBank/v1/catalog/admin/:id/status
 * 
 * Propósito: Cambiar el estado operativo de una promoción
 * Acceso: Solo Admin
 * Middlewares:
 * - validateStatusChange: Valida que newStatus sea válido (ACTIVA, INACTIVA, PAUSADA, EXPIRADA)
 * Body: newStatus, reason
 * Auditoría: Registra DESACTIVAR, PAUSAR o REACTIVAR según el nuevo estado
 */
router.put('/admin/:id/status', verifyTokenAndGetUser, verifyRoles(['Admin']), validatePromotionId, validateStatusChange, updatePromotionStatus);

/**
 * PUT /nexusBank/v1/catalog/admin/:id
 * 
 * Propósito: Actualizar campos de una promoción existente
 * Acceso: Solo Admin
 * Middlewares:
 * - validateUpdatePromotion: Valida tipos de datos y valores permitidos
 * Body: campos a actualizar (solo allowedFields se procesarán)
 * Auditoría: Registra ACTUALIZAR con previousValues y newValues
 */
router.put('/admin/:id', verifyTokenAndGetUser, verifyRoles(['Admin']), validatePromotionId, validateUpdatePromotion, updatePromotion);

/**
 * DELETE /nexusBank/v1/catalog/admin/:id
 * 
 * Propósito: Desactivar una promoción (soft delete)
 * Acceso: Solo Admin
 * Nota: No elimina físicamente el registro, solo cambia status a INACTIVA
 * Body opcional: reason (justificación de la desactivación)
 * Auditoría: Registra DESACTIVAR
 */
router.delete('/admin/:id', verifyTokenAndGetUser, verifyRoles(['Admin']), validatePromotionId, deletePromotion);

// ============= RUTAS PÚBLICAS (sin autenticación) - AL FINAL (menos específicas) =============
// Estas rutas son accesibles para cualquier usuario sin autenticación.
// Se declaran AL FINAL para que no capturen rutas administrativas más específicas.

/**
 * GET /nexusBank/v1/catalog
 * 
 * Propósito: Listar todas las promociones actualmente disponibles para clientes
 * Acceso: Público (sin autenticación)
 * Filtros automáticos:
 * - Solo status='ACTIVA'
 * - Solo promociones no expiradas (endDate >= hoy o sin endDate)
 * - Excluye campos administrativos sensibles
 */
router.get('/', getAllPromotions);

/**
 * GET /nexusBank/v1/catalog/:id
 * 
 * Propósito: Obtener detalles completos de una promoción específica
 * Acceso: Público (sin autenticación)
 * Middlewares:
 * - validatePromotionId: Valida formato del ID
 * Params: id (ID de la promoción)
 * Response adicional: isCurrentlyValid (bandera de validez temporal y de límites)
 * 
 * NOTA IMPORTANTE: Esta ruta usa parámetro dinámico /:id
 * Por eso DEBE declararse después de todas las rutas /admin/...
 * De lo contrario capturaría peticiones como /admin/all tratando "admin" como un ID.
 */
router.get('/:id', validatePromotionId, getPromotionById);

export default router;
