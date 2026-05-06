import { AuthContainer, AuthCard } from '../../../shared/components/auth/index.js';
import { RegisterForm } from '../components/RegisterForm.jsx';

export const CrearCuenta = () => {
  return (
    <AuthContainer>
      <AuthCard
        logoSrc="/src/assets/img/Logo.jpg"
        logoAlt="NexusBank"
        title="Crear Cuenta"
        subtitle="Regístrate para comenzar"
      >
        <RegisterForm />
      </AuthCard>
    </AuthContainer>
  );
};
