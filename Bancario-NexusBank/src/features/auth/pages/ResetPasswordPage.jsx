import { AuthContainer, AuthCard } from '../../../shared/components/auth/index.js';
import { useForm } from 'react-hook-form';
import { AuthInput, AuthPrimaryButton } from '../../../shared/components/auth/index.js';
import { resetPassword } from '../../../shared/api/auth.js';
import { showError, showSuccess } from '../../../shared/utils/toast.js';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export const ResetPasswordPage = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const query = useQuery();
  const token = query.get('token');

  if (!token) {
    navigate('/login', { replace: true });
    return null;
  }

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const payload = { token: token || data.token, newPassword: data.password };
      const res = await resetPassword(payload);
      setLoading(false);
      if (res?.data?.success || res?.status === 200) {
        showSuccess('Contraseña restablecida correctamente');
        sessionStorage.removeItem('nexusbank-password-reset-flow');
        navigate('/login', { replace: true });
        return;
      }
      showError(res?.data?.message || 'No fue posible restablecer la contraseña');
    } catch (err) {
      setLoading(false);
      showError(err?.response?.data?.message || 'Error al procesar la solicitud');
    }
  };

  return (
    <AuthContainer>
      <AuthCard
        logoSrc="/src/assets/animation/Sinfondo.webm"
        logoAlt="NexusBank"
        title="Restablecer contraseña"
        subtitle="Elige una nueva contraseña para tu cuenta"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">

          <AuthInput
            id="password"
            label="Nueva contraseña"
            type="password"
            placeholder="••••••••"
            register={register}
            rules={{ required: 'La contraseña es obligatoria', minLength: { value: 8, message: 'Mínimo 8 caracteres' } }}
            error={errors.password}
            autoComplete="new-password"
          />

          <AuthInput
            id="confirmPassword"
            label="Confirmar contraseña"
            type="password"
            placeholder="••••••••"
            register={register}
            rules={{
              validate: (value) => value === watch('password') || 'Las contraseñas no coinciden',
              required: 'Confirma la contraseña',
            }}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />

          <AuthPrimaryButton type="submit" loading={loading} loadingText="Restableciendo...">
            Restablecer contraseña
          </AuthPrimaryButton>
        </form>
      </AuthCard>
    </AuthContainer>
  );
};

export default ResetPasswordPage;
