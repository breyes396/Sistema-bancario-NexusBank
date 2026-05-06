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
        logoSrc="/src/assets/img/Logo.jpg"
        logoAlt="NexusBank"
        title={isForgot ? 'Recuperar Contraseña' : 'Bienvenido de Nuevo'}
        subtitle={
          isForgot ? 'Ingresa tu correo para recuperar contraseña' : 'Ingresa a tu cuenta NexusBank'
        }

      >
        <LoginForm onForgot={handleForgotPassword} />
      </AuthCard>
    </AuthContainer>
  );
};