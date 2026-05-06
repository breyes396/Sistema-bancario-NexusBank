import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { forgotPassword } from '../../../shared/api/auth.js';
import { AuthInput, AuthPrimaryButton, AuthSwitchLink } from '../../../shared/components/auth/index.js';
import { showError, showSuccess } from '../../../shared/utils/toast.js';

export const ForgotPasswordForm = ({ onSwitch }) => {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async ({ email }) => {
    try {
      setLoading(true);
      const { data } = await forgotPassword({ email });

      showSuccess(data?.message || 'Si el correo existe, recibirás instrucciones para recuperar tu contraseña.');
      onSwitch();
    } catch (error) {
      const message = error.response?.data?.message || 'No fue posible enviar el correo de recuperación';
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <AuthInput
        id="email"
        label="Email"
        type="email"
        placeholder="correo@ejemplo.com"
        register={register}
        rules={{
          required: 'El email es obligatorio',
        }}
        error={errors.email}
        autoComplete="email"
      />

      <AuthPrimaryButton type="submit" loading={loading} loadingText="Enviando...">
        Enviar Correo
      </AuthPrimaryButton>

      <AuthSwitchLink
        prefixText="¿Recordaste tu contraseña?"
        actionText="Iniciar Sesión"
        onClick={onSwitch}
      />
    </form>
  );
};