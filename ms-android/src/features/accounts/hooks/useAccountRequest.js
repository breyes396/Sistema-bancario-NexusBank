import { useState } from 'react';
import userClient from '../../../shared/api/userClient';

// Igual que en la web: el cliente solicita abrir una cuenta nueva y queda en
// estado PENDIENTE hasta que un administrador la aprueba o rechaza.
export const useAccountRequest = () => {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const submitRequest = async ({ accountType, note }) => {
        setSubmitting(true);
        setError(null);
        try {
            const response = await userClient.post('/accounts/requests', {
                accountType,
                note: note?.trim() || '',
            });
            return response.data?.data || response.data;
        } catch (err) {
            const message = err.response?.data?.message || 'No se pudo enviar la solicitud';
            setError(message);
            throw new Error(message);
        } finally {
            setSubmitting(false);
        }
    };

    return { submitting, error, submitRequest };
};
