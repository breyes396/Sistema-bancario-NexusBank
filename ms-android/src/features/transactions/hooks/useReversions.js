import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../../shared/store/authStore';

const STORAGE_KEY = 'nexusbank_reversal_requests';

export const useReversions = () => {
    const user = useAuthStore((state) => state.user);
    const [reversions, setReversions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchReversions = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            const userReversions = Array.isArray(parsed)
                ? parsed.filter(
                      (item) =>
                          String(item.userId) === String(user.id) ||
                          String(item.userEmail).toLowerCase() === String(user.email).toLowerCase()
                  )
                : [];
            
            // Sort by creation date descending
            userReversions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setReversions(userReversions);
        } catch (err) {
            setError('Error al cargar las solicitudes de reversión');
        } finally {
            setLoading(false);
        }
    }, [user]);

    const addReversion = useCallback(async ({
        type = 'TRANSFERENCIA',
        operationId,
        reference,
        amount,
        accountNumber = '',
        sourceAccountNumber = '',
        destinationAccountNumber = '',
        operationDate,
        operationDescription = '',
        reason
    }) => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            const current = raw ? JSON.parse(raw) : [];
            
            const isDuplicated = current.some(
                (item) =>
                    String(item.operationId) === String(operationId) &&
                    String(item.type) === String(type) &&
                    String(item.status) === 'PENDING'
            );

            if (isDuplicated) {
                throw new Error('Ya existe una solicitud pendiente para esta operación.');
            }

            const nextRequest = {
                id: `rv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                type,
                operationId,
                reference: reference || operationId,
                amount: parseFloat(amount || 0),
                accountNumber,
                sourceAccountNumber,
                destinationAccountNumber,
                operationDate: operationDate || new Date().toISOString(),
                operationDescription,
                reason,
                userId: user.id,
                userEmail: user.email.toLowerCase(),
                userName: user.name || user.username || '',
                status: 'PENDING',
                createdAt: new Date().toISOString(),
                resolvedAt: null,
                adminComment: null,
                source: 'CLIENT_ACTION'
            };

            const updated = [nextRequest, ...current];
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            setReversions((prev) => [nextRequest, ...prev]);
            return nextRequest;
        } catch (err) {
            setError(err.message || 'Error al guardar la solicitud de reversión');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchReversions();
    }, [fetchReversions]);

    return { reversions, loading, error, refetch: fetchReversions, addReversion };
};
