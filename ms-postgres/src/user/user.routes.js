'use strict';

import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  getAdminClientDetail,
  updateUser
} from './user.controller.js';
import { validateBearerToken } from '../../middlewares/auth-middleware.js';
import { verifyIsAdmin } from '../../middlewares/role-middleware.js';

const router = Router();

router.get('/', validateBearerToken, verifyIsAdmin, getAllUsers);

router.get('/admin/client/:id/detail', validateBearerToken, verifyIsAdmin, getAdminClientDetail);

router.get('/:id', validateBearerToken, verifyIsAdmin, getUserById);

router.put('/:id', validateBearerToken, updateUser);

export default router;
