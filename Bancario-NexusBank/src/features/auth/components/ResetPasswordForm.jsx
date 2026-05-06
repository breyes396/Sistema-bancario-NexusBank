import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { resetPassword } from '../../../shared/api/auth.js';
import { AuthInput, AuthPrimaryButton, AuthSwitchLink } from '../../../shared/components/auth/index.js';
import { showError, showSuccess } from '../../../shared/utils/toast.js';

export const ResetPasswordForm = ({ token, onSwitch }) => {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();

  const password = watch('password');

  const onSubmit = async ({ password, passwordConfirm }) => {
    if (!token) {
      showError('Falta el token de recuperación. Revisa el enlace del correo.');
      return;
    }

    try {
      setLoading(true);
      const { data } = await resetPassword({ token, password, passwordConfirm });

      showSuccess(data?.message || 'Tu contraseña fue actualizada correctamente.');
      onSwitch();
    } catch (error) {
      const message = error.response?.data?.message || 'No fue posible actualizar la contraseña';
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <AuthInput
        id="password"
        label="Nueva contraseña"
        type="password"
        placeholder="••••••••"
        register={register}
        rules={{
          required: 'La contraseña es obligatoria',
          minLength: {
            value: 8,
            message: 'La contraseña debe tener al menos 8 caracteres',
          },
        }}
        error={errors.password}
        autoComplete="new-password"
      />

      <AuthInput
        id="passwordConfirm"
        label="Confirmar contraseña"
        type="password"
        placeholder="••••••••"
        register={register}
        rules={{
          required: 'Debes confirmar la contraseña',
          validate: (value) => value === password || 'Las contraseñas no coinciden',
        }}
        error={errors.passwordConfirm}
        autoComplete="new-password"
      />

      <AuthPrimaryButton type="submit" loading={loading} loadingText="Guardando...">
        Cambiar contraseña
      </AuthPrimaryButton>

      <AuthSwitchLink prefixText="¿No era tu correo?" actionText="Volver al inicio" onClick={onSwitch} />
    </form>
  );
};