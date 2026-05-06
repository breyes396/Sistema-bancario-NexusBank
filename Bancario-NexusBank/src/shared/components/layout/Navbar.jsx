import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../features/auth/store/authStore.js';
import { showSuccess } from '../../utils/toast.js';
import { FaSignOutAlt, FaUser } from 'react-icons/fa';

export const Navbar = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    showSuccess('Sesión cerrada correctamente');
    navigate('/', { replace: true });
  };

  return (
    <nav className="bg-gradient-to-r from-[#2D5899] to-[#1A2E52] shadow-lg sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#C8A84B] flex items-center justify-center">
            <span className="font-bold text-white text-lg">NB</span>
          </div>
          <span className="text-xl font-bold text-white">NexusBank</span>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-6">
          {/* User Info */}
          <div className="flex items-center gap-2 text-white">
            <FaUser className="text-[#C8A84B]" />
            <span className="text-sm font-medium">
              {user?.username || user?.email || 'Cliente'}
            </span>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 text-white transition-colors"
          >
            <FaSignOutAlt size={16} />
            <span className="text-sm font-medium">Salir</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

