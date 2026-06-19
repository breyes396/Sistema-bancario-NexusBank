import axios from 'axios';
import { useAuthStore } from '../../features/auth/store/authStore.js';

const favoritesBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api/v1';

const axiosFavorite = axios.create({
  baseURL: favoritesBaseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const normalizeFavorite = (favorite = {}) => ({
  id: favorite.id || favorite._id || '',
  accountNumber: favorite.accountNumber || '',
  accountType: String(favorite.accountType || '').toLowerCase() || 'ahorro',
  alias: favorite.alias || '',
  isActive: favorite.isActive ?? true,
  createdAt: favorite.createdAt || null,
  updatedAt: favorite.updatedAt || null,
});

const unwrap = (response) => response?.data?.data || response?.data || {};

export const clientFavoriteService = {
  getFavorites: async (params = {}) => {
    const response = await axiosFavorite.get('/favorites', {
      params,
      headers: getAuthHeaders(),
    });

    const data = unwrap(response);
    const favorites = Array.isArray(data?.favorites) ? data.favorites : Array.isArray(data) ? data : [];

    return favorites.map((item) => normalizeFavorite(item));
  },

  createFavorite: async (payload) => {
    const response = await axiosFavorite.post('/favorites', payload, {
      headers: getAuthHeaders(),
    });

    return normalizeFavorite(unwrap(response));
  },

  updateFavorite: async (favoriteId, payload) => {
    const response = await axiosFavorite.put(`/favorites/${favoriteId}`, payload, {
      headers: getAuthHeaders(),
    });

    return normalizeFavorite(unwrap(response));
  },

  deleteFavorite: async (favoriteId) => {
    const response = await axiosFavorite.delete(`/favorites/${favoriteId}`, {
      headers: getAuthHeaders(),
    });

    return unwrap(response);
  },
};
