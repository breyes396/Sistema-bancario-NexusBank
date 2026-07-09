import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '../../auth/store/authStore.js';
import { Navbar } from './Navbar.jsx';
import { Sidebar } from './Sidebar.jsx';

export const DashboardLayout = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    user: state.user,
  }));

  useEffect(() => {
    // Validar autenticación
    if (!isAuthenticated) {
      navigate('/', { replace: true });
      return;
    }

    // Validar rol CLIENTE
    const userRole = user?.role || '';
    const isClient = userRole === 'CLIENTE' || userRole === 'Client' || userRole === 'cliente';

    if (!isClient) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
