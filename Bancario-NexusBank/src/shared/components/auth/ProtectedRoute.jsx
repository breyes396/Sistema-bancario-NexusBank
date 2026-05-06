import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../../features/auth/store/authStore.js';

export const ProtectedRoute = ({ children, requiredRole }) => {
  const token = useAuthStore((state) => state.token);
  const userRole = useAuthStore((state) => state.user?.role);

  // Si no hay token, redirige al login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Si se requiere un rol específico y el usuario no lo tiene
  if (requiredRole) {
    const normalizedUserRole = userRole?.toUpperCase();
    const normalizedRequiredRole = requiredRole.toUpperCase();

    if (normalizedUserRole !== normalizedRequiredRole) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};
