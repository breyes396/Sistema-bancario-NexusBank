import React, { useState } from 'react';
import AdminNavbar from './AdminNavbar.jsx';
import AdminSidebar from './adminsidebar.jsx';
import '../../../styles/adminDashboard.css';

// Datos de ejemplo para movimientos
const movementsData = [
  {
    id: 1,
    type: 'Depósito',
    description: 'Carlos M.',
    date: 'Hoy 09:14',
    amount: '+Q5,000',
    amountValue: 5000,
    amountType: 'positive'
  },
  {
    id: 2,
    type: 'Transferencia',
    description: 'Ana R.',
    date: 'Hoy 08:50',
    amount: '-Q1,200',
    amountValue: -1200,
    amountType: 'negative'
  },
  {
    id: 3,
    type: 'Pago pendiente',
    description: 'Luis T.',
    date: 'Ayer 17:30',
    amount: 'Pendiente',
    amountValue: 0,
    amountType: 'pending'
  }
];

// Componente Card reutilizable
const StatCard = ({ title, value, subtitle, color = '' }) => (
  <div className={`stat-card ${color}`}>
    <div className="stat-label">{title}</div>
    <div className="stat-value">{value}</div>
    {subtitle && <div className={`stat-subtitle ${subtitle.includes('+') ? 'positive' : 'negative'}`}>{subtitle}</div>}
  </div>
);

export const AdminDashboardContainer = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtrar movimientos
  const filteredMovements = movementsData.filter(m => {
    const matchSearch = m.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'ALL' || m.type === filterType;
    return matchSearch && matchType;
  });

  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const currentMovements = filteredMovements.slice(startIdx, startIdx + itemsPerPage);

  const getAmountColor = (type) => {
    if (type === 'positive') return '#10b981';
    if (type === 'negative') return '#ef4444';
    return '#fbbf24';
  };

  const getStatusBadge = (amountType) => {
    if (amountType === 'positive') return { bg: '#d1fae5', color: '#047857', text: 'Ingreso' };
    if (amountType === 'negative') return { bg: '#fee2e2', color: '#991b1b', text: 'Egreso' };
    return { bg: '#fef3c7', color: '#92400e', text: 'Pendiente' };
  };

  return (
    <div className="admin-dashboard">
      <AdminNavbar />
      <div className="admin-container">
        <AdminSidebar />
        <main className="admin-main">
          <section className="admin-section">
            {/* Stats Cards */}
            <div className="stats-grid">
              <StatCard title="Total usuarios" value="142" subtitle="+12 este mes" color="blue" />
              <StatCard title="Transacciones hoy" value="38" subtitle="+5.2%" color="light-blue" />
              <StatCard title="Cuentas pendientes" value="3" subtitle="Requieren acción" color="light-red" />
            </div>

            {/* Movimientos Table Section */}
            <div className="movements-section">
              {/* Header with search and filter */}
              <div className="movements-header">
                <h3 className="movements-title">Movimientos recientes</h3>
                <div className="filters-container">
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Buscar por usuario..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                  <select
                    className="filter-select"
                    value={filterType}
                    onChange={(e) => {
                      setFilterType(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="ALL">Todos los tipos</option>
                    <option value="Depósito">Depósitos</option>
                    <option value="Transferencia">Transferencias</option>
                    <option value="Pago pendiente">Pagos pendientes</option>
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
                        const badge = getStatusBadge(movement.amountType);
                        return (
                          <tr key={movement.id}>
                            <td>{movement.type}</td>
                            <td>{movement.description}</td>
                            <td className="date-column">{movement.date}</td>
                            <td className={`amount-${movement.amountType}`}>
                              {movement.amount}
                            </td>
                            <td>
                              <span className={`status-badge badge-${movement.amountType === 'positive' ? 'ingreso' : movement.amountType === 'negative' ? 'egreso' : 'pendiente'}`}>
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination-container">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions and Promotions */}
            <div className="actions-promotions-grid">
              {/* Accesos Rápidos - Left Column */}
              <div className="quick-actions-section">
                <h3 className="section-title">Accesos rápidos</h3>
                <div className="actions-grid">
                  {['Usuarios', 'Depósitos', 'Transacciones', 'Pendientes'].map((action, i) => (
                    <div key={i} className="action-card">
                      <div className="action-title">{action}</div>
                      <div className="action-subtitle">Ver detalles</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Promotions - Right Column */}
              <div className="promotions-section">
                <div className="promotions-header">
                  <h3 className="section-title">Promociones</h3>
                  <a href="#" className="new-promotion-link">+ Nueva promoción</a>
                </div>
                <ul className="promotions-list">
                  <li className="promotion-item">
                    <div className="promotion-content">
                      <div className="promotion-info">
                        <div className="promotion-name">Tasa preferencial ahorros</div>
                        <div className="promotion-description">5% anual · Aplica cuentas nuevas</div>
                      </div>
                      <span className="status-badge badge-ingreso">Activa</span>
                    </div>
                  </li>
                  <li className="promotion-item">
                    <div className="promotion-content">
                      <div className="promotion-info">
                        <div className="promotion-name">Sin comisión transferencias</div>
                        <div className="promotion-description">Todo mayo 2026</div>
                      </div>
                      <span className="status-badge badge-ingreso">Activa</span>
                    </div>
                  </li>
                  <li className="promotion-item">
                    <div className="promotion-content">
                      <div className="promotion-info">
                        <div className="promotion-name">Bono apertura cuenta corriente</div>
                        <div className="promotion-description">Inicia 01 jun 2026</div>
                      </div>
                      <span className="status-badge" style={{background: '#dbeafe', color: '#1e40af'}}>Próxima</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardContainer;
