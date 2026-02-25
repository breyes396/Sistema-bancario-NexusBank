import { Router } from 'express';
import { validateBearerToken, verifyAccountExists } from '../../middlewares/auth-middleware.js';
import { verifyImplementation, createTransactionTest } from './test.controller.js';

const router = Router();

/**
 * RUTA 1: Verificar que toda la implementación funciona
 * POST /nexusBank/v1/test/verify-implementation
 * 
 * Requiere:
 * - Token JWT válido
 * - Headers: Authorization: Bearer <token>
 * - Body: { toUserId, fromUserId? }
 * 
 * Valida:
 * - Modelo Transaction en MongoDB ✓
 * - Campo saldo en User ✓
 * - Campo accountBalance en Account ✓
 * - Middleware verifyAccountExists ✓
 */
router.post(
    '/verify-implementation',
    validateBearerToken,
    verifyImplementation
);

/**
 * RUTA 2: Crear una transacción de test
 * POST /nexusBank/v1/test/create-transaction
 * 
 * Requiere:
 * - Token JWT válido
 * - Headers: Authorization: Bearer <token>
 * - Body:
 *   {
 *     toUserId: number,
 *     fromUserId?: number,
 *     monto: number,
 *     tipo: 'Depósito' | 'Transferencia' | 'Compra',
 *     descripcion?: string
 *   }
 */
router.post(
    '/create-transaction',
    validateBearerToken,
    verifyAccountExists,
    createTransactionTest
);

export default router;
