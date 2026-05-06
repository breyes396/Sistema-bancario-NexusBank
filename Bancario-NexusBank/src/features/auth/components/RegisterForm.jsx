import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { showError } from '../../../shared/utils/toast.js';
import { AuthInput, AuthPrimaryButton, AuthSwitchLink } from '../../../shared/components/auth/index.js';

export const RegisterForm = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      showError('Las contraseñas no coinciden');
      return;
    }
    // TODO: Implement API call
    showError('El registro de usuarios aún no está disponible');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
      <AuthInput
        id="name"
        label="Nombre completo"
        type="text"
        placeholder="Juan Pérez"
        register={register}
        rules={{ required: 'El nombre es obligatorio' }}
        error={errors.name}
      />
      
      <AuthInput
        id="email"
        label="Correo electrónico"
        type="email"
        placeholder="usuario@correo.com"
        register={register}
        rules={{ required: 'El correo es obligatorio' }}
        error={errors.email}
      />
      
      <AuthInput
        id="password"
        label="Contraseña"
        type="password"
        placeholder="••••••••"
        register={register}
        rules={{ required: 'La contraseña es obligatoria' }}
        error={errors.password}
      />
      
      <AuthInput
        id="confirmPassword"
        label="Confirmar Contraseña"
        type="password"
        placeholder="••••••••"
        register={register}
        rules={{ required: 'La confirmación es obligatoria' }}
        error={errors.confirmPassword}
      />

      <AuthPrimaryButton type="submit" loading={false} loadingText="Creando...">
        Crear cuenta
      </AuthPrimaryButton>

      <AuthSwitchLink
        prefixText="¿Ya tienes cuenta?"
        actionText="Inicia sesión"
        onClick={() => navigate('/')}
      />
    </form>
  );
};
