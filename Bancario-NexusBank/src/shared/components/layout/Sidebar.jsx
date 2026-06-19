import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../features/auth/store/authStore.js';
import { 
  FaHome, 
  FaCreditCard, 
  FaHistory, 
  FaMoneyBillWave, 
  FaExchangeAlt, 
  FaUndo, 
  FaStar, 
  FaGift, 
  FaChartBar, 
  FaUsers, 
  FaBriefcase, 
  FaClipboardList, 
  FaCog 
} from 'react-icons/fa';

export const Sidebar = () => {
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);

  const userRole = useAuthStore((state) => state.user?.role);
  const isAdmin = userRole === 'Admin' || userRole === 'Administrador' || userRole === 'PLATFORM_ADMIN';

  const clientNavItems = [
    { path: '/clientdashboard', label: 'Inicio', icon: FaHome },
    { path: '/clientdashboard/accounts', label: 'Mis Cuentas', icon: FaCreditCard },
    { path: '/clientdashboard/account-history', label: 'Historial', icon: FaHistory },
    { path: '/clientdashboard/deposits', label: 'Depósitos', icon: FaMoneyBillWave },
    { path: '/clientdashboard/transfers', label: 'Transferencias', icon: FaExchangeAlt },
    { path: '/clientdashboard/reversions', label: 'Reversiones', icon: FaUndo },
    { path: '/clientdashboard/favorites', label: 'Favoritos', icon: FaStar },
    { path: '/clientdashboard/promotions', label: 'Promociones', icon: FaGift },
  ];

  const adminNavItems = [
    { path: '/AdminDashboard', label: 'Dashboard', icon: FaChartBar },
    { path: '/AdminDashboard/users', label: 'Usuarios', icon: FaUsers },
    { path: '/AdminDashboard/accounts', label: 'Cuentas', icon: FaBriefcase },
    { path: '/AdminDashboard/transactions', label: 'Transacciones', icon: FaClipboardList },
    { path: '/AdminDashboard/settings', label: 'Configuración', icon: FaCog },
  ];

  const navItems = isAdmin ? adminNavItems : clientNavItems;

  return (
    <aside className="fixed inset-y-0 left-0 w-64 glass-panel border-r z-20 hidden md:flex flex-col animate-fade-in-up">
      <div className="p-6 flex items-center justify-center border-b border-gray-200/50">
        <video src="/src/assets/animation/Sinfondo.webm" autoPlay loop muted playsInline className="h-10 mix-blend-multiply" />
        <span className="ml-3 text-xl font-bold text-[#1A2E52]">NexusBank</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const IconComponent = item.icon;
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
              <span className="text-xl mr-3">
                <IconComponent className="w-5 h-5" />
              </span>
              <span className="font-semibold text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

    </aside>
  );
};
