import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout.jsx';
import { adminDashboardService } from '../../../api/adminDashboard.service.js';
import { axiosAdmin } from '../../../api/api.js';
import '../../../../styles/adminDashboard.css';
import { FaUserTie, FaUsers, FaClipboardList, FaGift } from 'react-icons/fa';

// Componente Card reutilizable
const StatCard = ({ title, value, subtitle, color = '' }) => (
  <div className={`stat-card glass-panel shadow-lg ${color}`}>
    <div className="stat-label text-gray-500 font-semibold">{title}</div>
    <div className="stat-value text-3xl font-bold text-[#1A2E52]">{value}</div>
    {subtitle && <div className={`stat-subtitle font-medium ${subtitle.includes('+') ? 'positive text-green-600' : 'negative text-red-600'}`}>{subtitle}</div>}
  </div>
);

export const AdminDashboardContainer = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [promotions, setPromotions] = useState([]);
  const itemsPerPage = 5;
  
  const [stats, setStats] = useState({ totalUsers: 0, transactionsToday: 0, pendingAccounts: 0 });
  const [movementsData, setMovementsData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDashboardInfo = async () => {
    try {
      const response = await adminDashboardService.getDashboardInfo();
      if (response && response.data) {
        setStats(response.data.stats || { totalUsers: 0, transactionsToday: 0, pendingAccounts: 0 });
        setMovementsData(response.data.recentTransactions || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard info:', err);
    }
  };

  const fetchPromotions = async () => {
    try {
      const response = await adminDashboardService.getAdminPromotions();
      const data = response;
      const promoList = Array.isArray(data.data) ? data.data : (data.promotions || []);
      setPromotions(promoList.slice(0, 3)); // Solo mostramos las 3 primeras en el widget
    } catch (err) {
      console.error('Error fetching promotions:', err);
    }
  };

  useEffect(() => {
    fetchDashboardInfo();
    fetchPromotions();
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const currentMovements = movementsData.slice(0, itemsPerPage);

  const getMovementTypeLabel = (type) => {
    if (!type) return 'Movimiento';
    if (type.includes('TRANSFERENCIA')) return 'Transferencia';
    if (type.includes('DEPOSITO')) return 'Depósito';
    if (type.includes('RETIRO')) return 'Retiro';
    if (type.includes('COMPRA')) return 'Compra';
    return type.replaceAll('_', ' ');
  };

  const getAmountColor = (type) => {
    if (type === 'positive' || type === 'DEPOSITO') return '#10b981';
    if (type === 'negative' || type === 'RETIRO' || type === 'TRANSFERENCIA_ENVIADA') return '#ef4444';
    return '#fbbf24';
  };

  const getStatusBadge = (status, type) => {
    const s = (status || '').toUpperCase();
    
    if (s === 'COMPLETADA' || s === 'APROBADA' || s === 'COMPLETED') {
      return { bg: '#d1fae5', color: '#047857', text: 'Aprobado', className: 'badge-ingreso' };
    }
    if (s === 'RECHAZADA' || s === 'FALLIDA' || s === 'REJECTED') {
      return { bg: '#fee2e2', color: '#991b1b', text: 'Rechazado', className: 'badge-egreso' };
    }
    return { bg: '#fef3c7', color: '#92400e', text: 'Pendiente', className: 'badge-pendiente' };
  };

  return (
    <AdminLayout>
      <section className="admin-section">
            {/* Stats Cards */}
            <div className="stats-grid">
              <StatCard title="Total usuarios" value={loading ? '...' : stats.totalUsers} subtitle="" color="blue" />
              <StatCard title="Transacciones hoy" value={loading ? '...' : stats.transactionsToday} subtitle="Hoy" color="light-blue" />
              <StatCard title="Cuentas revertidas" value={loading ? '...' : stats.pendingAccounts} subtitle="Requieren acción" color="light-red" />
            </div>

            {/* Movimientos Table Section */}
            <div className="movements-section glass-panel shadow-md rounded-2xl overflow-hidden border border-white/40">
              {/* Header with search and filter */}
              <div className="movements-header">
                <h3 className="movements-title">Movimientos recientes</h3>
                <div className="filters-container">
                  <select
                    className="filter-select"
                    value={filterType}
                    onChange={(e) => {
                      setFilterType(e.target.value);
                    }}
                  >
                    <option value="ALL">Todos los tipos</option>
                    <option value="DEPOSITO">Depósitos</option>
                    <option value="TRANSFERENCIA">Transferencias</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="table-wrapper">
                <table className="movements-table">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Usuario</th>
                      <th>Fecha y hora</th>
                      <th>Monto</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentMovements && currentMovements.length > 0 ? (
                      currentMovements.map((movement) => {
                        const status = movement.status || 'PENDIENTE';
                        const badge = getStatusBadge(status, movement.type);
                        const isPositive = movement.type === 'DEPOSITO' || movement.type === 'TRANSFERENCIA_RECIBIDA';
                        
                        return (
                          <tr key={movement.id}>
                            <td className="font-medium text-xs">{getMovementTypeLabel(movement.type)}</td>
                            <td>{movement.userName}</td>
                            <td className="date-column">{new Date(movement.date).toLocaleString()}</td>
                            <td className={`${isPositive ? 'amount-positive' : 'amount-negative'} whitespace-nowrap`}>
                              {isPositive ? '+' : '-'} Q {movement.amount}
                            </td>
                            <td>
                              <span className={`status-badge ${badge.className}`}>
                                {badge.text}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="empty-message">
                          No hay movimientos que coincidan con tu búsqueda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>

            {/* Quick Actions and Promotions */}
            <div className="actions-promotions-grid">
              {/* Accesos Rápidos - Left Column */}
              <div className="quick-actions-section glass-panel shadow-md rounded-2xl border border-white/40 p-5">
                {/* Yellow Button Requested by User */}
                <div 
                  className="mt-6 p-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg transform transition hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #C8A84B, #b0933e)' }}
                  onClick={() => navigate('/AdminDashboard/employees')}
                >
                  <FaUserTie className="text-xl" />
                  Ir a Empleados
                </div>

                {/* Users Button */}
                <div 
                  className="mt-3 p-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg transform transition hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}
                  onClick={() => navigate('/AdminDashboard/users')}
                >
                  <FaUsers className="text-xl" />
                  Usuarios
                </div>

                {/* Pending Accounts Button */}
                <div 
                  className="mt-3 p-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg transform transition hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                  onClick={() => navigate('/AdminDashboard/requests')}
                >
                  <FaClipboardList className="text-xl" />
                  Ir a Pendientes
                </div>

                {/* Promotions Management Button */}
                <div 
                  className="mt-3 p-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg transform transition hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #2D5899, #1A2E52)' }}
                  onClick={() => navigate('/AdminDashboard/promotions')}
                >
                  <FaGift className="text-xl" />
                  Gestión de Promociones
                </div>
              </div>

              {/* Promotions - Right Column */}
              <div className="promotions-section glass-panel shadow-md rounded-2xl border border-white/40 p-5">
                <div className="promotions-header">
                  <h3 className="section-title">Promociones</h3>
                  <a href="#" onClick={(e) => { e.preventDefault(); navigate('/AdminDashboard/promotions'); }} className="new-promotion-link">+ Gestión de promociones</a>
                </div>
                <ul className="promotions-list">
                  {promotions.length === 0 ? (
                    <li className="promotion-item text-gray-500">No hay promociones disponibles.</li>
                  ) : (
                    promotions.map((promo) => (
                      <li key={promo._id} className="promotion-item">
                        <div className="promotion-content">
                          <div className="promotion-info">
                            <div className="promotion-name">{promo.name}</div>
                            <div className="promotion-description line-clamp-1">{promo.description || promo.promotionType.replace(/_/g, ' ')}</div>
                          </div>
                          <span className={`status-badge ${promo.status === 'ACTIVA' ? 'badge-ingreso' : ''}`} style={promo.status !== 'ACTIVA' ? { background: '#dbeafe', color: '#1e40af' } : {}}>
                            {promo.status === 'ACTIVA' ? 'Activa' : promo.status.charAt(0) + promo.status.slice(1).toLowerCase()}
                          </span>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
      </section>
    </AdminLayout>
  );
};

export default AdminDashboardContainer;
