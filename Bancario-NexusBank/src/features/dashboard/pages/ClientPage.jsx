import { Card, Typography } from '@material-tailwind/react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../auth/store/authStore.js';
import { showSuccess } from '../../../shared/utils/toast.js';

export const ClientPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    showSuccess('Sesión cerrada correctamente');
    navigate('/', { replace: true });
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <Card className="w-full border p-8 shadow">
          <Typography variant="h3" className="text-2xl font-bold">
            Bienvenido cliente
          </Typography>
          <Typography className="mt-3 text-slate-600">
            Usuario: {user?.username || user?.id || 'Cliente'}
          </Typography>

          <div className="mt-8">
            <button
              onClick={handleLogout}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-white"
            >
              Cerrar sesión
            </button>
          </div>
        </Card>
      </div>
    </main>
  );
};
