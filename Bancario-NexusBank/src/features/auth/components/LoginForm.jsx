import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { showError, showSuccess } from '../../../shared/utils/toast.js';
import { AuthInput, AuthPrimaryButton, AuthSecondaryButton, AuthSwitchLink } from '../../../shared/components/auth/index.js';

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
      const user = result.data?.userDetails || useAuthStore.getState().user;

      const isAdmin = user?.role === 'PLATFORM_ADMIN' || user?.role === 'Admin' || user?.role === 'Administrador';

      if (isAdmin) {
        navigate('/AdminDashboard');
      } else {
        navigate('/clientdashboard');
      }

      showSuccess('¡Bienvenido de nuevo!');
      return;
    }

    showError(result.error || 'No fue posible iniciar sesión');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
      <AuthInput
        id="emailOrUsername"
        label="Número de usuario o correo"
        type="text"
        placeholder="usuario@correo.com"
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

      <div className="auth-inline-row">
        <label className="auth-remember">
          <input type="checkbox" style={{ accentColor: '#2D5899' }} />
          <span>Recordar este dispositivo</span>
        </label>
      </div>

      {error && <p className="auth-error">{error}</p>}

      <AuthPrimaryButton type="submit" loading={loading} loadingText="Iniciando...">
        Ingresar a mi cuenta
      </AuthPrimaryButton>

      <AuthSecondaryButton type="button" onClick={onForgot}>
        Se me olvidó la contraseña
      </AuthSecondaryButton>

      <AuthSwitchLink
        prefixText="¿No tienes cuenta?"
        actionText="Regístrate aquí"
        onClick={() => navigate('/register')}
      />
    </form>
  );
};