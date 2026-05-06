import { AuthContainer, AuthCard } from '../../../shared/components/auth/index.js';
import { showError } from '../../../shared/utils/toast.js';
import { LoginForm } from '../components/LoginForm.jsx';

export const AuthPage = () => {
  const handleForgotPassword = () => {
    showError('La recuperación de contraseña aún no está disponible');
  };

  return (
    <AuthContainer>
      <AuthCard
        title="Bienvenido de Nuevo"
        subtitle="Ingresa a tu cuenta de administrador NexusBank"
      >
        <LoginForm onForgot={handleForgotPassword} />
      </AuthCard>
    </AuthContainer>
  );
};