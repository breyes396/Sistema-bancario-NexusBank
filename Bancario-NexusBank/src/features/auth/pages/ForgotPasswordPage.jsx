import { AuthContainer, AuthCard } from '../../../shared/components/auth/index.js';
import { useForm } from 'react-hook-form';
import { AuthInput, AuthPrimaryButton } from '../../../shared/components/auth/index.js';
import { forgotPassword } from '../../../shared/api/auth.js';
import { showError, showSuccess } from '../../../shared/utils/toast.js';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RECOVERY_FLOW_KEY = 'nexusbank-password-reset-flow';

export const ForgotPasswordPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [countdown, setCountdown] = useState(4);
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem(RECOVERY_FLOW_KEY) === 'sent') {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!emailSent) return undefined;

    const intervalId = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const timeoutId = window.setTimeout(() => {
      navigate('/login', { replace: true });
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [emailSent, navigate]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const res = await forgotPassword({ email: data.email });
      setLoading(false);
      if (res?.data?.success || res?.status === 200) {
        showSuccess('Se ha enviado un correo con instrucciones para restablecer la contraseña');
        sessionStorage.setItem(RECOVERY_FLOW_KEY, 'sent');
        setEmailSent(true);
        setCountdown(5);
        return;
      }
      showError(res?.data?.message || 'No fue posible enviar el correo de recuperación');
    } catch (err) {
      setLoading(false);
      showError(err?.response?.data?.message || 'Error al enviar solicitud');
    }
  };

  return (
    <AuthContainer mode="forgot">
      <AuthCard
        logoSrc="/src/assets/animation/Sinfondo.webm"
        logoAlt="NexusBank"
        title={emailSent ? 'Correo enviado' : 'Recuperar contraseña'}
        subtitle={emailSent ? 'Revisa tu bandeja y abre el enlace para crear tu nueva contraseña' : 'Ingresa tu correo para recibir un enlace seguro de restablecimiento'}
      >
        {emailSent ? (
          <div className="auth-sent-state">
            <div className="auth-sent-logo-wrap">
              <video src="/src/assets/animation/Sinfondo.webm" autoPlay loop muted playsInline className="auth-sent-logo" />
            </div>

            <div className="auth-sent-check">✓</div>

            <p className="auth-sent-text">
              Te enviamos un correo con el enlace para restablecer tu contraseña.
            </p>
            <p className="auth-sent-text auth-sent-text-secondary">
              Serás redirigido al inicio de sesión en {countdown}s.
            </p>

            <button
              type="button"
              className="auth-sent-link"
              onClick={() => navigate('/login', { replace: true })}
            >
              Ir ahora al login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
            <AuthInput
              id="email"
              label="Correo electrónico"
              type="email"
              placeholder="usuario@correo.com"
              register={register}
              rules={{ required: 'El correo es obligatorio' }}
              error={errors.email}
              autoComplete="email"
            />

            <AuthPrimaryButton type="submit" loading={loading} loadingText="Enviando...">
              Enviar correo de recuperación
            </AuthPrimaryButton>
          </form>
        )}
      </AuthCard>
    </AuthContainer>
  );
};

export default ForgotPasswordPage;
