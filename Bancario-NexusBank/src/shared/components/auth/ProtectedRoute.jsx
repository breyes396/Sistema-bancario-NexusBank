import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../../features/auth/store/authStore.js';

// Normaliza variantes del rol empleado/Employee al mismo valor canónico
const canonicalRole = (role) => {
  if (!role) return '';
  const r = role.toUpperCase();
  if (r === 'EMPLOYEE' || r === 'EMPLEADO') return 'EMPLOYEE';
  if (r === 'ADMIN' || r === 'ADMINISTRADOR') return 'ADMIN';
  if (r === 'CLIENT' || r === 'CLIENTE') return 'CLIENT';
  return r;
};

export const ProtectedRoute = ({ children, requiredRole, excludeRole }) => {
  const token = useAuthStore((state) => state.token);
  const userRole = useAuthStore((state) => state.user?.role);

  // Si no hay token, redirige al login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  const userCanonical = canonicalRole(userRole);

  // Si el usuario tiene un rol excluido, redirigir a su panel
  if (excludeRole && userCanonical === canonicalRole(excludeRole)) {
    if (userCanonical === 'EMPLOYEE') return <Navigate to="/EmployeeDashboard" replace />;
    return <Navigate to="/" replace />;
  }

  // Si se requiere un rol específico y el usuario no lo tiene
  if (requiredRole) {
    if (userCanonical !== canonicalRole(requiredRole)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};
