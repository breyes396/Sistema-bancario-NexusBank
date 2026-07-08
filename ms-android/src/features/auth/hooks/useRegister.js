import { useState } from 'react';
import authClient from '../../../shared/api/authClient';
import {
    isRequired,
    isValidEmail,
    isValidPhone,
    isValidDPI,
    getPasswordErrors,
} from '../../../shared/utils/validators';

// La app móvil solo ofrece cuentas Monetarias: el selector de tipo de cuenta
// que existe en la web se omite a propósito y se fuerza este valor.
const MOBILE_ACCOUNT_TYPE = 'monetaria';

const INITIAL_FORM = {
    fullName: '',
    documentNumber: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
};

export const useRegister = () => {
    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);

    const setField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: null }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!isRequired(form.fullName) || form.fullName.trim().length < 3) {
            newErrors.fullName = 'Ingresa tu nombre completo (mínimo 3 caracteres)';
        }
        if (!isValidDPI(form.documentNumber)) {
            newErrors.documentNumber = 'El DPI debe tener 13 dígitos';
        }
        if (!isValidEmail(form.email)) {
            newErrors.email = 'Ingresa un correo válido';
        }
        if (!isValidPhone(form.phoneNumber)) {
            newErrors.phoneNumber = 'El teléfono debe tener 8 dígitos';
        }

        const passwordErrors = getPasswordErrors(form.password);
        if (passwordErrors.length > 0) {
            newErrors.password = passwordErrors[0];
        }
        if (form.password !== form.confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const submit = async () => {
        setApiError(null);
        setSuccessMessage(null);
        if (!validate()) return false;

        setLoading(true);
        try {
            const payload = {
                name: form.fullName.trim(),
                documentType: 'DPI',
                documentNumber: form.documentNumber.trim(),
                email: form.email.trim(),
                phoneNumber: form.phoneNumber.trim(),
                password: form.password,
                accountType: MOBILE_ACCOUNT_TYPE,
            };

            const response = await authClient.post('/auth/register', payload);

            setSuccessMessage(
                response.data?.msg ||
                    'Solicitud enviada. Tu cuenta Monetaria quedó pendiente de aprobación.'
            );
            setForm(INITIAL_FORM);
            return true;
        } catch (err) {
            const message =
                err.response?.data?.errors?.[0]?.msg ||
                err.response?.data?.msg ||
                err.response?.data?.message ||
                'No fue posible completar el registro';
            setApiError(message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        form,
        setField,
        errors,
        apiError,
        successMessage,
        loading,
        submit,
    };
};
