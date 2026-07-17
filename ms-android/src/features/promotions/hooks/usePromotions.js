import { useState, useEffect, useCallback, useRef } from 'react';
import mongoClient from '../../../shared/api/mongoClient';
import { filterVisiblePromotions } from '../utils/promotionHelpers';

const normalizePromotion = (promo = {}) => ({
    ...promo,
    id: promo.id || promo._id || '',
});

const SEARCH_DEBOUNCE_MS = 400;

// GET /catalog es público (sin auth) y busca server-side vía ?search=, igual
// que clientPromotion.service.js en la web. Se debounce para no golpear al
// backend en cada tecla mientras se escribe.
export const usePromotions = () => {
    const [search, setSearch] = useState('');
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const debounceRef = useRef(null);

    const fetchPromotions = useCallback(async (searchTerm = '') => {
        try {
            setLoading(true);
            setError(null);
            const response = await mongoClient.get('/catalog', {
                params: searchTerm ? { search: searchTerm } : {},
            });
            const raw = response.data?.data || [];
            setPromotions(filterVisiblePromotions(raw.map(normalizePromotion)));
        } catch (err) {
            setError(err.response?.data?.message || 'Error al cargar las promociones');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPromotions();
    }, [fetchPromotions]);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchPromotions(search);
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(debounceRef.current);
    }, [search, fetchPromotions]);

    const refetch = useCallback(() => fetchPromotions(search), [fetchPromotions, search]);

    return { promotions, loading, error, search, setSearch, refetch };
};
