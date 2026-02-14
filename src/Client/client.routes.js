'use strict';

import { Router } from 'express';
import { employeeCreateClient, loginClient } from './client.controller.js';
import { verifyTokenAndGetUser, verifyIsEmployee } from '../../middlewares/role-middleware.js';

const router = Router();

router.post(
    '/login',
    loginClient);

/**
 * POST /employee/create-client
 * Endpoint para que un empleado cree una cuenta de cliente
 * @middleware verifyTokenAndGetUser - Valida token JWT
 * @middleware verifyIsEmployee - Verifica que sea empleado
 */
router.post(
    '/employee/create-client',
    verifyTokenAndGetUser,
    verifyIsEmployee,
    employeeCreateClient
);

export default router;