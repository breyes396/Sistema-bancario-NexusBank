import { useState } from 'react';
import { useAuthStore } from '../../../features/auth/store/authStore.js';
import { useClientStore } from '../../../features/client/store/useClientStore.js';

export const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const userProfile = useClientStore((state) => state.userProfile);

  const userName = userProfile?.name || userProfile?.Name || user?.firstName || user?.name || 'Usuario';
  const roleMap = {
    'Admin': 'Administrador',
    'Employee': 'Empleado',
    'Client': 'Cliente'
  };
  const userRole = roleMap[user?.role] || user?.role || 'Cliente';

  return (
    <header className="glass-navbar fixed top-0 left-0 right-0 h-20 z-10 md:pl-64 flex items-center justify-between px-6 lg:px-10 animate-fade-in-up">
      <div className="flex items-center">
        {/* Mobile menu button could go here */}
        <h2 className="text-xl font-bold text-[#1A2E52] hidden sm:block">Panel de Cliente</h2>
      </div>

      <div className="flex items-center space-x-6 relative">
        <button className="relative p-2 text-gray-500 hover:text-[#2D5899] transition bg-white/50 rounded-full shadow-sm hover-lift">
          <span className="text-xl">🔔</span>
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
        </button>

        <div 
          className="flex items-center space-x-3 border-l pl-6 border-gray-300/50 cursor-pointer select-none"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-[#1A2E52]">{userName}</p>
            <p className="text-xs text-gray-500">{userRole}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#2D5899] to-[#C8A84B] flex items-center justify-center text-white font-bold shadow-md hover:shadow-lg transition-shadow">
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>

        {isDropdownOpen && (
          <div className="absolute top-14 right-0 w-48 bg-white border border-gray-100 shadow-2xl rounded-xl py-2 z-50">
            <button
              onClick={() => {
                setIsDropdownOpen(false);
                logout();
              }}
              className="w-full text-left px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center"
            >
              <span className="mr-2">🚪</span> Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
