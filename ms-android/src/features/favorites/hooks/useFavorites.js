import { useState, useEffect, useCallback } from 'react';
import mongoClient from '../../../shared/api/mongoClient';
import { normalizeFavoritePayload } from '../utils/favoriteHelpers';

const normalizeFavorite = (favorite = {}) => ({
    id: favorite.id || favorite._id || '',
    accountNumber: favorite.accountNumber || '',
    accountType: String(favorite.accountType || 'ahorro').toLowerCase(),
    alias: favorite.alias || '',
    isActive: favorite.isActive ?? true,
    createdAt: favorite.createdAt || null,
});

export const useFavorites = () => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mutating, setMutating] = useState(false);
    const [error, setError] = useState(null);

    const fetchFavorites = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await mongoClient.get('/favorites');
            const raw = response.data?.data?.favorites || [];
            setFavorites(raw.map(normalizeFavorite));
        } catch (err) {
            setError(err.response?.data?.message || 'Error al cargar los favoritos');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFavorites();
    }, [fetchFavorites]);

    const createFavorite = async (form) => {
        setMutating(true);
        setError(null);
        try {
            const payload = normalizeFavoritePayload(form);
            const response = await mongoClient.post('/favorites', payload);
            const created = normalizeFavorite(response.data?.data);
            setFavorites((prev) => [created, ...prev]);
            return created;
        } catch (err) {
            const message = err.response?.data?.message || 'Error al agregar el favorito';
            setError(message);
            throw new Error(message);
        } finally {
            setMutating(false);
        }
    };

    // El backend ignora accountNumber en la actualización: solo alias/accountType/isActive.
    const updateFavorite = async (id, form) => {
        setMutating(true);
        setError(null);
        try {
            const payload = {
                alias: String(form.alias || '').trim(),
                accountType: String(form.accountType || 'ahorro').trim().toLowerCase(),
            };
            const response = await mongoClient.put(`/favorites/${id}`, payload);
            const updated = normalizeFavorite(response.data?.data);
            setFavorites((prev) => prev.map((fav) => (fav.id === id ? { ...fav, ...updated } : fav)));
            return updated;
        } catch (err) {
            const message = err.response?.data?.message || 'Error al actualizar el favorito';
            setError(message);
            throw new Error(message);
        } finally {
            setMutating(false);
        }
    };

    const deleteFavorite = async (id) => {
        setMutating(true);
        setError(null);
        try {
            await mongoClient.delete(`/favorites/${id}`);
            setFavorites((prev) => prev.filter((fav) => fav.id !== id));
        } catch (err) {
            const message = err.response?.data?.message || 'Error al eliminar el favorito';
            setError(message);
            throw new Error(message);
        } finally {
            setMutating(false);
        }
    };

    return {
        favorites,
        loading,
        mutating,
        error,
        refetch: fetchFavorites,
        createFavorite,
        updateFavorite,
        deleteFavorite,
    };
};
