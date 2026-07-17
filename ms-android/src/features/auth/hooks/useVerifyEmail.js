import { useState } from 'react';
import authClient from '../../../shared/api/authClient';
import { isRequired, isValidEmail } from '../../../shared/utils/validators';

// Igual que VerificationForm.jsx de la web: token pegado a mano, envía
// { token } a POST /auth/verify-email. Además expone resendVerification
// (POST /auth/resend-verification), que el backend ya soporta pero la web
// nunca expone en su UI — aquí sí, tal como se pidió.
export const useVerifyEmail = (initialEmail = '') => {
    const [token, setToken] = useState('');
    const [email, setEmail] = useState(initialEmail);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [verified, setVerified] = useState(false);
    const [resending, setResending] = useState(false);
    const [resendMessage, setResendMessage] = useState(null);

    const submit = async () => {
        setError(null);
        if (!isRequired(token)) {
            setError('Por favor ingresa el token de verificación');
            return false;
        }

        setLoading(true);
        try {
            await authClient.post('/auth/verify-email', { token: token.trim() });
            setVerified(true);
            return true;
        } catch (err) {
            const message =
                err.response?.data?.msg ||
                err.response?.data?.message ||
                'Error al verificar el email';
            setError(message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const resendVerification = async () => {
        setResendMessage(null);
        setError(null);
        if (!isValidEmail(email)) {
            setError('Ingresa el correo con el que te registraste para reenviar el código');
            return false;
        }

        setResending(true);
        try {
            const response = await authClient.post('/auth/resend-verification', {
                email: email.trim(),
            });
            setResendMessage(response.data?.msg || 'Correo de verificación reenviado');
            return true;
        } catch (err) {
            const message =
                err.response?.data?.errors?.[0]?.msg ||
                err.response?.data?.msg ||
                'No fue posible reenviar el correo de verificación';
            setError(message);
            return false;
        } finally {
            setResending(false);
        }
    };

    return {
        token,
        setToken,
        email,
        setEmail,
        error,
        loading,
        verified,
        resending,
        resendMessage,
        submit,
        resendVerification,
    };
};
