import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../features/auth/store/authStore.js';

// Construye la URL de la foto limpia (sin duplicar ?t=)
const buildPhotoSrc = (url) => {
  if (!url) return '';
  const cleanUrl = url.split('?')[0];
  if (cleanUrl.startsWith('http')) return cleanUrl;
  const authUrl = import.meta.env.VITE_AUTH_URL || 'http://localhost:3007/api/v1';
  const authOrigin = authUrl.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
  if (cleanUrl.startsWith('/uploads')) return `${authOrigin}${cleanUrl}`;
  if (cleanUrl.startsWith('/api/v1/uploads')) return `${authOrigin}${cleanUrl.replace(/^\/api\/v1/, '')}`;
  return `${authOrigin}/${cleanUrl.replace(/^\//, '')}`;
};

export const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  // Leer DIRECTAMENTE del authStore para reactividad inmediata
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const userUsername = user?.username || user?.name || user?.firstName || 'Usuario';
  const roleMap = { Admin: 'Administrador', Employee: 'Empleado', Client: 'Cliente' };
  const userRole = roleMap[user?.role] || user?.role || 'Cliente';

  // Foto: leer del authStore (se actualiza inmediatamente al subir)
  const rawPhotoUrl = user?.profilePhotoUrl || '';
  const photoBase = buildPhotoSrc(rawPhotoUrl);
  // Cache-buster con timestamp fijo por sesión — se regenera solo cuando rawPhotoUrl cambia
  const photoSrc = photoBase ? `${photoBase}?t=${rawPhotoUrl.length}_${Date.now()}` : '';

  return (
    <header className="glass-navbar fixed top-0 left-0 right-0 h-20 z-10 md:pl-64 flex items-center justify-between px-6 lg:px-10 animate-fade-in-up">
      <div className="flex items-center">
        <h2 className="text-xl font-bold text-[#1A2E52] hidden sm:block">Panel de Cliente</h2>
      </div>

      <div className="flex items-center space-x-6 relative">
        {/* Campana */}
        <button className="relative p-2 text-gray-500 hover:text-[#2D5899] transition bg-white/50 rounded-full shadow-sm hover-lift">
          <span className="text-xl">🔔</span>
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
        </button>

        {/* Usuario */}
        <div
          className="flex items-center space-x-3 border-l pl-6 border-gray-300/50 cursor-pointer select-none"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-[#1A2E52]">{userUsername}</p>
            <p className="text-xs text-gray-500">{userRole}</p>
          </div>

          {/* Avatar: foto si existe, inicial si no */}
          {photoSrc ? (
            <img
              key={rawPhotoUrl}
              src={photoSrc}
              alt={userUsername}
              className="w-10 h-10 rounded-full object-cover shadow-md hover:shadow-lg transition-shadow border-2 border-[#C8A84B]"
              onError={(e) => {
                // Si la imagen falla, mostrar inicial
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          {/* Inicial — se muestra si no hay foto o si la foto falla */}
          <div
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#2D5899] to-[#C8A84B] items-center justify-center text-white font-bold shadow-md hover:shadow-lg transition-shadow"
            style={{ display: photoSrc ? 'none' : 'flex' }}
          >
            {userUsername.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Dropdown */}
        {isDropdownOpen && (
          <div className="absolute top-14 right-0 w-48 bg-white border border-gray-100 shadow-2xl rounded-xl py-2 z-50">
            <button
              onClick={() => {
                setIsDropdownOpen(false);
                navigate('/clientdashboard/profile-settings');
              }}
              className="w-full text-left px-4 py-2 text-sm font-semibold text-[#1A2E52] hover:bg-blue-50 transition-colors flex items-center"
            >
              <span className="mr-2">⚙️</span> Ajustes de perfil
            </button>
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