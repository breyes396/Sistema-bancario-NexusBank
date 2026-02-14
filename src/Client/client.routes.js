'use strict';

import { Router } from 'express';
import { employeeCreateClient, loginClient, getAllClients, updateUser, deleteUser } from './client.controller.js';
import { verifyTokenAndGetUser, verifyIsEmployee, verifyIsAdmin, verifyRoles } from '../../middlewares/role-middleware.js';

const router = Router();

router.post(
    '/login',
    loginClient);


router.post(
    '/employee/create-client',
    verifyTokenAndGetUser,
    verifyIsEmployee,
    employeeCreateClient
);


router.get(
    '/users',
    verifyTokenAndGetUser,
    verifyRoles(['Admin', 'Employee']),
    getAllClients
);


router.put(
    '/user/:id',
    verifyTokenAndGetUser,
    updateUser
);


router.delete(
    '/user/:id',
    verifyTokenAndGetUser,
    verifyIsAdmin,
    deleteUser
);

export default router;