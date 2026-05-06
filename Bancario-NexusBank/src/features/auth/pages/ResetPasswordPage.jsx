import { useNavigate, useSearchParams } from 'react-router-dom';
import { ResetPasswordForm } from '../components/ResetPasswordForm.jsx';
import { AuthCard, AuthContainer } from '../../../shared/components/auth/index.js';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  return (
    <AuthContainer>
      <AuthCard
        logoSrc="/src/assets/img/Logo.jpg"
        logoAlt="NexusBank"
        title="Restablecer contraseña"
        subtitle="Crea una nueva contraseña para volver a entrar a tu cuenta"
      >
        <ResetPasswordForm token={token} onSwitch={() => navigate('/')} />
      </AuthCard>
    </AuthContainer>
  );
};