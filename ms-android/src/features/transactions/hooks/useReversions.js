import { useState, useEffect, useCallback } from 'react';
import userClient from '../../../shared/api/userClient';

// Solicitudes de reversión respaldadas por el backend real (ms-postgres):
// se registran en la base de datos para que el administrador las vea desde
// cualquier dispositivo, en vez de guardarse solo en este teléfono.
export const useReversions = () => {
    const [reversions, setReversions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchReversions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await userClient.get('/accounts/reversal-requests');
            const data = response.data?.data || [];
            setReversions(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al cargar las solicitudes de reversión');
        } finally {
            setLoading(false);
        }
    }, []);

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
        setLoading(true);
        setError(null);
        try {
            const response = await userClient.post('/accounts/reversal-requests', {
                type,
                operationId,
                reference: reference || operationId,
                amount,
                accountNumber,
                sourceAccountNumber,
                destinationAccountNumber,
                operationDate,
                operationDescription,
                reason,
            });
            const created = response.data?.data;
            if (created) {
                setReversions((prev) => [created, ...prev]);
            }
            return created;
        } catch (err) {
            const message = err.response?.data?.message || 'Error al enviar la solicitud de reversión';
            setError(message);
            throw new Error(message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReversions();
    }, [fetchReversions]);

    return { reversions, loading, error, refetch: fetchReversions, addReversion };
};
