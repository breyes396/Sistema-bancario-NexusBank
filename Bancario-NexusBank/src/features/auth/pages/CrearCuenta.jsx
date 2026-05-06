import { Registrarse } from '../components/Registrarse.jsx';
import { AuthCard, AuthContainer } from '../../../shared/components/auth/index.js';

export const CrearCuenta = () => {
  return (
    <AuthContainer>
      <AuthCard
        logoSrc="/src/assets/img/Logo.jpg"
        logoAlt="NexusBank"
        title="Crear Cuenta"
        subtitle="Únete a NexusBank y gestiona tu dinero de forma inteligente"
      >
        <Registrarse />
      </AuthCard>
    </AuthContainer>
  );
};
