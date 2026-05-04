import { useState } from 'react';
import { LoginForm } from '../components/LoginForm.jsx';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm.jsx';
import { AuthCard, AuthContainer } from '../../../shared/components/auth/index.js';

export const AuthPage = () => {
  const [isForgot, setIsForgot] = useState(false);

  return (
    <AuthContainer>
      <AuthCard
        logoSrc="/src/assets/img/Logo.png"
        logoAlt="NexusBank"
        title={isForgot ? 'Recuperar Contraseña' : 'Bienvenido de Nuevo'}
        subtitle={
          isForgot ? 'Ingresa tu correo para recuperar contraseña' : 'Ingresa a tu cuenta de administrador NexusBank'
        }
      >
        {isForgot ? (
          <ForgotPasswordForm
            onSwitch={() => {
              setIsForgot(false);
            }}
          />
        ) : (
          <LoginForm onForgot={() => setIsForgot(true)} />
        )}
      </AuthCard>
    </AuthContainer>
  );
};