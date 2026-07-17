import { useState } from 'react';
import authClient from '../../../shared/api/authClient';
import { useAuthStore } from '../../../shared/store/authStore';
import { isRequired } from '../../../shared/utils/validators';

export const useLogin = () => {
    const [emailOrUsername, setEmailOrUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState(null);
    const [apiErrorCode, setApiErrorCode] = useState(null);
    const [loading, setLoading] = useState(false);

    const login = useAuthStore((state) => state.login);

    const validate = () => {
        const newErrors = {};

        if (!isRequired(emailOrUsername)) {
            newErrors.emailOrUsername = 'El correo o usuario es requerido';
        }
        if (!isRequired(password)) {
            newErrors.password = 'La contraseña es requerida';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const submit = async () => {
        setApiError(null);
        setApiErrorCode(null);
        if (!validate()) return false;

        setLoading(true);
        try {
            const response = await authClient.post('/auth/login', {
                emailOrUsername: emailOrUsername.trim(),
                password,
            });

            const { token, refreshToken, user } = response.data?.data || {};
            if (!token) {
                throw new Error('Respuesta de autenticación inválida');
            }

            await login(token, user, refreshToken);
            return true;
        } catch (err) {
            const message = err.response?.data?.message || 'No fue posible iniciar sesión';
            setApiError(message);
            setApiErrorCode(err.response?.data?.code || null);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        emailOrUsername,
        setEmailOrUsername,
        password,
        setPassword,
        errors,
        apiError,
        apiErrorCode,
        loading,
        submit,
    };
};
