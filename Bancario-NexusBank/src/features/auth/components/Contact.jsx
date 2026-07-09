import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContainer, AuthCard, AuthInput, AuthPrimaryButton } from '../../../shared/components/auth/index.js';
import { showSuccess, showError } from '../../../shared/utils/toast.js';
import { addSupportRequest } from '../../../shared/utils/supportRequests.js';
import { useAuthStore } from '../store/authStore.js';

const Contact = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const [sent, setSent] = useState(false);
  const currentUser = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      addSupportRequest({
        email: data.email,
        description: data.description,
        userId: currentUser?.id || null,
        userName: currentUser?.name || currentUser?.username || null,
      });

      showSuccess('Mensaje enviado. Ya quedó registrado en Control de cuentas.');
      setSent(true);
      reset();
      window.setTimeout(() => {
        navigate('/', { replace: true });
      }, 700);
    } catch (err) {
      showError('No se pudo enviar el mensaje. Intenta de nuevo.');
    }
  };

  return (
    <AuthContainer mode="contact">
      <AuthCard title="Contacta al soporte" subtitle="Cuéntanos tu problema y te ayudaremos lo antes posible">
        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <AuthInput
            id="email"
            label="Correo electrónico"
            type="email"
            placeholder="usuario@correo.com"
            register={register}
            rules={{
              required: 'El correo es obligatorio',
              pattern: {
                value: /^\S+@\S+\.\S+$/,
                message: 'Ingrese un correo válido',
              },
            }}
            error={errors.email}
            autoComplete="email"
          />

          <div className="auth-field">
            <label htmlFor="description">Descripción del problema</label>
            <textarea
              id="description"
              placeholder="Describe lo que pasó, incluye pasos para reproducir si aplica..."
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '10px 12px',
                borderRadius: '8px',
                border: errors.description ? '1px solid #d63a3a' : '1px solid #cad7eb',
                resize: 'vertical',
                fontFamily: 'inherit',
                fontSize: '0.95rem',
              }}
              onFocus={(e) => {
                e.target.style.boxShadow = '0 0 0 2px rgba(45, 88, 153, 0.12)';
                e.target.style.borderColor = '#2D5899';
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = 'none';
                e.target.style.borderColor = errors.description ? '#d63a3a' : '#cad7eb';
              }}
              {...register('description', {
                required: 'La descripción es obligatoria',
                minLength: { value: 10, message: 'Describe con más detalle (mínimo 10 caracteres)' },
              })}
            />

            {errors.description && <p className="auth-error">{errors.description.message}</p>}
          </div>

          <AuthPrimaryButton type="submit" loading={isSubmitting} loadingText="Enviando...">
            Enviar a soporte
          </AuthPrimaryButton>

          {sent && <p style={{ marginTop: 12, color: '#16a34a', fontWeight: 600 }}>Mensaje enviado correctamente.</p>}
        </form>
      </AuthCard>
    </AuthContainer>
  );
};

export default Contact;
