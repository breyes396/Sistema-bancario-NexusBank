import { AuthContainer, AuthCard } from '../../../shared/components/auth/index.js';
import { LoginForm } from '../components/LoginForm.jsx';
import { useNavigate } from 'react-router-dom';

export const AuthPage = () => {
  const navigate = useNavigate();

  const handleForgotPassword = () => {
    navigate('/reset-password');
  };

  return (
    <AuthContainer>
      <AuthCard
        logoSrc="/src/assets/img/Logo.jpg"
        logoAlt="NexusBank"
        title="Bienvenido de Nuevo"
        subtitle="Ingresa a tu cuenta NexusBank"
      >
        <LoginForm onForgot={handleForgotPassword} />
      </AuthCard>
    </AuthContainer>
  );
};