import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../features/auth/store/authStore.js';

export const Sidebar = () => {
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);

  const navItems = [
    { path: '/clientdashboard', label: 'Inicio', icon: '🏠' },
    { path: '/clientdashboard/accounts', label: 'Mis Cuentas', icon: '💳' },
    { path: '/clientdashboard/transfers', label: 'Transferencias', icon: '💸' },
    { path: '/clientdashboard/transactions', label: 'Movimientos', icon: '📋' },
    { path: '/clientdashboard/profile', label: 'Mi Perfil', icon: '👤' },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 w-64 glass-panel border-r z-20 hidden md:flex flex-col animate-fade-in-up">
      <div className="p-6 flex items-center justify-center border-b border-gray-200/50">
        <img src="/src/assets/img/Logo.jpg" alt="NexusBank" className="h-10 mix-blend-multiply" />
        <span className="ml-3 text-xl font-bold text-[#1A2E52]">NexusBank</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-[#2D5899] to-[#1A2E52] text-white shadow-md transform scale-[1.02]'
                  : 'text-gray-600 hover:bg-white/60 hover:text-[#2D5899]'
              }`}
            >
              <span className="text-xl mr-3">{item.icon}</span>
              <span className="font-semibold text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200/50">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center px-4 py-3 text-red-500 font-semibold text-sm bg-red-50/50 hover:bg-red-100 rounded-xl transition-colors"
        >
          <span className="mr-2">🚪</span> Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};
