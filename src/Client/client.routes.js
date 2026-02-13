'use strict';

import { Router } from 'express';
import { registerClient, loginClient } from './client.controller.js';

const router = Router();

router.post(
    '/register', 
    registerClient);

router.post(
    '/login',
    loginClient);

export default router;