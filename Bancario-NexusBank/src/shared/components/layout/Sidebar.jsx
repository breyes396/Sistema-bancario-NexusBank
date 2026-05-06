import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FaHome,
  FaWallet,
  FaExchangeAlt,
  FaChartLine,
  FaCog,
  FaBars,
  FaTimes,
} from 'react-icons/fa';

const menuItems = [
  { id: 'dashboard', label: 'Inicio', icon: FaHome, path: '/client' },
  { id: 'accounts', label: 'Cuentas', icon: FaWallet, path: '/client/accounts' },
  {
    id: 'transactions',
    label: 'Transferencias',
    icon: FaExchangeAlt,
    path: '/client/transactions',
  },
  { id: 'investments', label: 'Inversiones', icon: FaChartLine, path: '/client/investments' },
  { id: 'settings', label: 'Configuración', icon: FaCog, path: '/client/settings' },
];

export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Toggle Button for Mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 z-40 rounded-lg bg-[#2D5899] p-3 text-white md:hidden"
      >
        {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-64 transform bg-[#1A2E52] transition-transform duration-300 ease-in-out md:relative md:top-0 md:translate-x-0 md:h-[calc(100vh-4rem)]`}
      >
        <div className="flex flex-col gap-2 p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left font-medium transition-colors ${
                  active
                    ? 'bg-[#C8A84B] text-[#1A2E52]'
                    : 'text-white hover:bg-[#2D5899]'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Overlay for Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
