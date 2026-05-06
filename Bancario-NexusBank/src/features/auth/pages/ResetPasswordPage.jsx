import { useNavigate } from 'react-router-dom';
import { AuthContainer, AuthCard, AuthPrimaryButton, AuthSwitchLink } from '../../../shared/components/auth/index.js';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();

  return (
    <AuthContainer>
      <AuthCard
        logoSrc="/src/assets/img/Logo.jpg"
        logoAlt="NexusBank"
        title="Recuperar Contraseña"
        subtitle="Ingresa tu correo para recuperar contraseña"
      >
        <div className="auth-form">
          <p style={{ textAlign: 'center', marginBottom: '1rem', color: '#666' }}>
            La funcionalidad de recuperación de contraseña aún no está disponible.
          </p>
          <AuthPrimaryButton type="button" onClick={() => navigate('/')}>
            Volver al Inicio
          </AuthPrimaryButton>
          <AuthSwitchLink
            prefixText="¿Recordaste tu contraseña?"
            actionText="Inicia sesión aquí"
            onClick={() => navigate('/')}
          />
        </div>
      </AuthCard>
    </AuthContainer>
  );
};
