import { useState } from 'react';
import authClient from '../../../shared/api/authClient';
import { getPasswordErrors, isRequired } from '../../../shared/utils/validators';

// Igual que ResetPasswordPage.jsx de la web, pero como la app no tiene forma
// de recibir el token por enlace, el usuario lo pega manualmente (la web
// también soporta esto cuando no llega ?token= en la URL). Se valida la
// contraseña fuerte completa en el cliente para no depender de que el
// backend rechace algo que el formulario web deja pasar.
export const useResetPassword = () => {
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const validate = () => {
        const newErrors = {};

        if (!isRequired(token)) {
            newErrors.token = 'Pega el token que recibiste por correo';
        }

        const passwordErrors = getPasswordErrors(password);
        if (passwordErrors.length > 0) {
            newErrors.password = passwordErrors[0];
        }
        if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const submit = async () => {
        setApiError(null);
        if (!validate()) return false;

        setLoading(true);
        try {
            await authClient.post('/auth/reset-password', {
                token: token.trim(),
                newPassword: password,
            });
            setSuccess(true);
            return true;
        } catch (err) {
            const message =
                err.response?.data?.errors?.[0]?.msg ||
                err.response?.data?.msg ||
                'No fue posible restablecer la contraseña';
            setApiError(message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        token,
        setToken,
        password,
        setPassword,
        confirmPassword,
        setConfirmPassword,
        errors,
        apiError,
        loading,
        success,
        submit,
    };
};
