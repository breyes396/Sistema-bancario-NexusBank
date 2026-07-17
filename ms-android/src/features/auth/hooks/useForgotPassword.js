import { useState } from 'react';
import authClient from '../../../shared/api/authClient';
import { isValidEmail } from '../../../shared/utils/validators';

// Igual que ForgotPasswordPage.jsx de la web: el backend siempre responde
// 200 con el mismo mensaje genérico (exista o no el correo), y el cuerpo es
// { msg } en vez del sobre { success, message } que usan otros endpoints.
export const useForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const submit = async () => {
        setError(null);
        if (!isValidEmail(email)) {
            setError('Ingresa un correo válido');
            return false;
        }

        setLoading(true);
        try {
            await authClient.post('/auth/forgot-password', { email: email.trim() });
            setSent(true);
            return true;
        } catch (err) {
            const message =
                err.response?.data?.errors?.[0]?.msg ||
                err.response?.data?.msg ||
                'No fue posible enviar el correo de recuperación';
            setError(message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { email, setEmail, error, loading, sent, submit };
};
