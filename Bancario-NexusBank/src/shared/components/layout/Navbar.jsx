import { useAuthStore } from '../../../features/auth/store/authStore.js';

export const Navbar = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="glass-navbar fixed top-0 left-0 right-0 h-20 z-10 md:pl-64 flex items-center justify-between px-6 lg:px-10 animate-fade-in-up">
      <div className="flex items-center">
        {/* Mobile menu button could go here */}
        <h2 className="text-xl font-bold text-[#1A2E52] hidden sm:block">Panel de Cliente</h2>
      </div>

      <div className="flex items-center space-x-6">
        <button className="relative p-2 text-gray-500 hover:text-[#2D5899] transition bg-white/50 rounded-full shadow-sm hover-lift">
          <span className="text-xl">🔔</span>
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
        </button>

        <div className="flex items-center space-x-3 border-l pl-6 border-gray-300/50">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-[#1A2E52]">{user?.firstName || 'Usuario'}</p>
            <p className="text-xs text-gray-500">Cliente Standard</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#2D5899] to-[#C8A84B] flex items-center justify-center text-white font-bold shadow-md">
            {user?.firstName?.charAt(0) || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};
