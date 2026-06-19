import { AuthContainer, AuthCard } from '../../../shared/components/auth/index.js';
import { LoginForm } from '../components/LoginForm.jsx';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RECOVERY_FLOW_KEY = 'nexusbank-password-reset-flow';

export const AuthPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    sessionStorage.removeItem(RECOVERY_FLOW_KEY);
  }, []);

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <AuthContainer>
      <AuthCard
        logoSrc="/src/assets/animation/Sinfondo.webm"
        logoAlt="NexusBank"
        title="Bienvenido de Nuevo"
        subtitle="Ingresa a tu cuenta NexusBank"
      >
        <LoginForm onForgot={handleForgotPassword} />
      </AuthCard>
    </AuthContainer>
  );
};