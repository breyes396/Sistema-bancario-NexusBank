import { SignupForm } from '../components/SignupForm.jsx';
import { AuthCard, AuthContainer } from '../../../shared/components/auth/index.js';

export const SignupPage = () => {
  return (
    <AuthContainer>
      <AuthCard
        logoSrc="/src/assets/img/Logo.jpg"
        logoAlt="NexusBank"
        title="Crear Cuenta"
        subtitle="Únete a NexusBank y gestiona tu dinero de forma inteligente"
      >
        <SignupForm />
      </AuthCard>
    </AuthContainer>
  );
};
