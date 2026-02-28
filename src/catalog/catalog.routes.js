'use strict';

import { Router } from 'express';
import {
  getAllCatalogItems,
  getCatalogItemById,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
  getAllCatalogItemsAdmin
} from './catalog.controller.js';
import { validateBearerToken } from '../../middlewares/auth-middleware.js';
import { verifyIsAdmin } from '../../middlewares/role-middleware.js';
import {
  validateCreateProduct,
  validateUpdateProductRequest
} from '../../middlewares/product-validators.js';

const router = Router();

router.get('/', getAllCatalogItems);

router.get('/admin/all', validateBearerToken, verifyIsAdmin, getAllCatalogItemsAdmin);
router.post('/', validateBearerToken, verifyIsAdmin, validateCreateProduct, createCatalogItem);
router.put('/:id', validateBearerToken, verifyIsAdmin, validateUpdateProductRequest, updateCatalogItem);
router.delete('/:id', validateBearerToken, verifyIsAdmin, deleteCatalogItem);
router.get('/:id', getCatalogItemById);

export default router;
