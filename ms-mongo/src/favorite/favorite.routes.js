import express from 'express';
import { createFavorite, getFavorites, getFavoriteById, updateFavorite, deleteFavorite } from './favorite.controller.js';
import { verifyTokenAndGetUser, verifyRoles } from '../../middlewares/role-middleware.js';

const router = express.Router();

router.post('/favorites', verifyTokenAndGetUser, verifyRoles(['Client']), createFavorite);

router.get('/favorites', verifyTokenAndGetUser, verifyRoles(['Client']), getFavorites);

router.get('/favorites/:id', verifyTokenAndGetUser, verifyRoles(['Client']), getFavoriteById);

router.put('/favorites/:id', verifyTokenAndGetUser, verifyRoles(['Client']), updateFavorite);

router.delete('/favorites/:id', verifyTokenAndGetUser, verifyRoles(['Client']), deleteFavorite);

export default router;
