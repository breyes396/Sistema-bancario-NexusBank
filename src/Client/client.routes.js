'use strict';

import { Router } from 'express';
import { 
    registerClient, 
    employeeCreateClient, 
    loginClient, 
    getAllClients, 
    updateUser, 
    deleteUser,
    verifyEmail,
    resendVerificationEmail,
    requestPasswordReset,
    resetPassword
} from './client.controller.js';
import { verifyTokenAndGetUser, verifyIsEmployee, verifyIsAdmin, verifyRoles } from '../../middlewares/role-middleware.js';

const router = Router();

router.post(
    '/login',
    loginClient);

router.post(
    '/register',
    registerClient);

// Email verification
router.post(
    '/verify-email',
    verifyEmail);

router.post(
    '/resend-verification',
    resendVerificationEmail);

// Password reset
router.post(
    '/request-password-reset',
    requestPasswordReset);

router.post(
    '/reset-password',
    resetPassword);


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