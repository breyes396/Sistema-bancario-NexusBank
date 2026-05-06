import { Button, Card, Typography } from '@material-tailwind/react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { showSuccess } from '../../../shared/utils/toast.js';

export const InicioSesion = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    showSuccess('Sesión cerrada correctamente');
    navigate('/', { replace: true });
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <Card className="w-full border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-black/30 backdrop-blur">
          <Typography variant="h2" className="text-3xl font-black text-white">
            Inicio de Sesión
          </Typography>
          <Typography className="mt-3 max-w-2xl text-slate-300">
            La sesión está activa y el estado global conserva el token y los datos básicos del usuario.
          </Typography>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <Typography variant="small" className="text-slate-400">
                Usuario autenticado
              </Typography>
              <Typography className="mt-2 text-lg font-semibold text-white">
                {user?.username || user?.id || 'Administrador'}
              </Typography>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <Typography variant="small" className="text-slate-400">
                Rol
              </Typography>
              <Typography className="mt-2 text-lg font-semibold text-white">
                {user?.role || 'PLATFORM_ADMIN'}
              </Typography>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              onClick={handleLogout}
              className="rounded-xl bg-emerald-600 text-sm font-semibold normal-case hover:bg-emerald-700"
            >
              Cerrar sesión
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
};