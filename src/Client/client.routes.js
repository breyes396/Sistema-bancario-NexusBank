'use strict';

import { Router } from 'express';
import { registerClient } from './client.controller.js';

const router = Router();

router.post(
    '/register', 
    registerClient);

export default router;