import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { showError, showSuccess } from '../../../shared/utils/toast.js';
import { AuthInput, AuthPrimaryButton, AuthSwitchLink } from '../../../shared/components/auth/index.js';

export const LoginForm = ({ onForgot }) => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    const result = await login(data);

    if (result.success) {
      const user = result.data?.userDetails;

      if (user?.role === 'PLATFORM_ADMIN') {
        navigate('/dashboard');
      } else {
        navigate('/client');
      }

      showSuccess('¡Bienvenido de nuevo!');
      return;
    }

    showError(result.error || 'No fue posible iniciar sesión');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <AuthInput
        id="emailOrUsername"
        label="Email o Usuario"
        type="text"
        placeholder="correo@ejemplo.com o usuario"
        register={register}
        rules={{
          required: 'Este campo es obligatorio',
        }}
        error={errors.emailOrUsername}
        autoComplete="username"
      />

      <AuthInput
        id="password"
        label="Contraseña"
        type="password"
        placeholder="••••••••"
        register={register}
        rules={{
          required: 'La contraseña es obligatoria',
        }}
        error={errors.password}
        autoComplete="current-password"
      />

      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}

      <AuthPrimaryButton type="submit" loading={loading} loadingText="Iniciando...">
        Iniciar Sesión
      </AuthPrimaryButton>

      <AuthSwitchLink
        actionText="¿Olvidaste tu contraseña?"
        onClick={onForgot}
      />
    </form>
  );
};