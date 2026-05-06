import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { showError, showSuccess } from '../../../shared/utils/toast.js';
import { AuthInput, AuthPrimaryButton, AuthSwitchLink } from '../../../shared/components/auth/index.js';

export const Registrarse = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      showError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          username: data.username,
        }),
      });

      if (response.ok) {
        showSuccess('¡Cuenta creada exitosamente! Inicia sesión');
        navigate('/');
        return;
      }

      const error = await response.json();
      showError(error.message || 'Error al registrarse');
    } catch (error) {
      showError('Error en la conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <AuthInput
        id="email"
        label="Correo Electrónico"
        type="email"
        placeholder="correo@ejemplo.com"
        register={register}
        rules={{
          required: 'El correo es obligatorio',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Correo inválido',
          },
        }}
        error={errors.email}
      />

      <AuthInput
        id="username"
        label="Nombre de usuario"
        type="text"
        placeholder="tu_usuario"
        register={register}
        rules={{
          required: 'El usuario es obligatorio',
          minLength: {
            value: 3,
            message: 'Mínimo 3 caracteres',
          },
        }}
        error={errors.username}
      />

      <AuthInput
        id="password"
        label="Contraseña"
        type="password"
        placeholder="••••••••"
        register={register}
        rules={{
          required: 'La contraseña es obligatoria',
          minLength: {
            value: 6,
            message: 'Mínimo 6 caracteres',
          },
        }}
        error={errors.password}
      />

      <AuthInput
        id="confirmPassword"
        label="Confirmar Contraseña"
        type="password"
        placeholder="••••••••"
        register={register}
        rules={{
          required: 'Confirma tu contraseña',
          validate: (value) => value === password || 'Las contraseñas no coinciden',
        }}
        error={errors.confirmPassword}
      />

      <AuthPrimaryButton type="submit" loading={loading} loadingText="Registrando...">
        Crear Cuenta
      </AuthPrimaryButton>

      <div className="pt-2">
        <AuthSwitchLink
          prefixText="¿Ya tienes cuenta?"
          actionText="Inicia sesión"
          onClick={() => navigate('/')}
        />
      </div>
    </form>
  );
};
