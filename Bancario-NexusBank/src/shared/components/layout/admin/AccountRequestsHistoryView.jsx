import React, { useState, useEffect } from 'react';
import AdminNavbar from './AdminNavbar.jsx';
import AdminSidebar from './AdminSidebar.jsx';
import { adminDashboardService } from '../../../api/adminDashboard.service.js';
import { showError } from '../../../utils/toast.js';
import '../../../../styles/adminDashboard.css';

const AccountRequestsHistoryView = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('TODOS');

  const fetchAllRequests = async () => {
    try {
      setLoading(true);
      const response = await adminDashboardService.getAllAccountRequests();
      const requestsData = response.data || [];
      
      const formattedRequests = requestsData.map(req => ({
        id: req.id,
        accountType: req.accountType,
        userName: req.User?.email || 'Cliente desconocido',
        status: req.status,
        date: new Date(req.createdAt).toLocaleString(),
        approvedAt: req.approvedAt ? new Date(req.approvedAt).toLocaleString() : null,
        rejectedAt: req.rejectedAt ? new Date(req.rejectedAt).toLocaleString() : null,
        rejectionReason: req.rejectionReason,
        raw: req
      }));

      setRequests(formattedRequests.sort((a, b) => new Date(b.raw.createdAt) - new Date(a.raw.createdAt)));
    } catch (error) {
      console.error(error);
      showError('Error al cargar el historial de solicitudes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllRequests();
  }, []);

  const getStatusColor = (status) => {
    if (status === 'APPROVED') return 'badge-ingreso';
    if (status === 'REJECTED') return 'badge-egreso';
    return 'badge-pendiente';
  };

  const getStatusLabel = (status) => {
    if (status === 'APPROVED') return 'Aprobada';
    if (status === 'REJECTED') return 'Rechazada';
    return 'Pendiente';
  };

  const filteredRequests = requests.filter(r => {
    const searchStr = `${r.id} ${r.userName} ${r.accountType}`.toLowerCase();
    const matchSearch = searchStr.includes(searchTerm.toLowerCase());
    
    let matchStatus = true;
    if (filterStatus === 'PENDIENTES') matchStatus = r.status === 'PENDING';
    if (filterStatus === 'APROBADAS') matchStatus = r.status === 'APPROVED';
    if (filterStatus === 'RECHAZADAS') matchStatus = r.status === 'REJECTED';
    
    return matchSearch && matchStatus;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'PENDING').length,
    approved: requests.filter(r => r.status === 'APPROVED').length,
    rejected: requests.filter(r => r.status === 'REJECTED').length
  };

  return (
    <div className="admin-dashboard animate-fade-in-up">
      <AdminNavbar />
      <div className="admin-container">
        <AdminSidebar />
        <main className="admin-main">
          <section className="admin-section">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-[#1A2E52]">Historial de Solicitudes de Apertura de Cuenta</h2>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="stat-card glass-panel shadow-lg">
                <div className="stat-label text-gray-500 font-semibold">Total</div>
                <div className="stat-value text-3xl font-bold text-[#1A2E52]">{stats.total}</div>
              </div>
              <div className="stat-card glass-panel shadow-lg">
                <div className="stat-label text-gray-500 font-semibold">Pendientes</div>
                <div className="stat-value text-3xl font-bold text-orange-500">{stats.pending}</div>
              </div>
              <div className="stat-card glass-panel shadow-lg">
                <div className="stat-label text-gray-500 font-semibold">Aprobadas</div>
                <div className="stat-value text-3xl font-bold text-green-500">{stats.approved}</div>
              </div>
              <div className="stat-card glass-panel shadow-lg">
                <div className="stat-label text-gray-500 font-semibold">Rechazadas</div>
                <div className="stat-value text-3xl font-bold text-red-500">{stats.rejected}</div>
              </div>
            </div>
            
            <div className="movements-section glass-panel shadow-md rounded-2xl overflow-hidden border border-white/40">
              <div className="movements-header">
                <h3 className="movements-title">Todas las solicitudes</h3>
                <div className="filters-container">
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Buscar por ID, Email o Tipo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <select
                    className="filter-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="TODOS">Todos</option>
                    <option value="PENDIENTES">Pendientes</option>
                    <option value="APROBADAS">Aprobadas</option>
                    <option value="RECHAZADAS">Rechazadas</option>
                  </select>
                </div>
              </div>

              <div className="table-wrapper">
                <table className="movements-table">
                  <thead>
                    <tr>
                      <th>ID Solicitud</th>
                      <th>Tipo de Cuenta</th>
                      <th>Cliente</th>
                      <th>Solicitud</th>
                      <th>Estado</th>
                      <th>Procesamiento</th>
                      <th>Detalles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="7" className="text-center py-4">Cargando historial...</td></tr>
                    ) : filteredRequests.length > 0 ? (
                      filteredRequests.map((req) => (
                        <tr key={req.id}>
                          <td className="font-mono text-xs text-gray-600">{req.id}</td>
                          <td className="font-medium text-sm capitalize">
                            {req.accountType === 'ahorro' ? 'Cuenta de Ahorros' : 
                             req.accountType === 'corriente' ? 'Cuenta Corriente' : 
                             req.accountType}
                          </td>
                          <td className="font-semibold text-gray-700 text-sm">{req.userName}</td>
                          <td className="date-column text-xs">{req.date}</td>
                          <td>
                            <span className={`status-badge ${getStatusColor(req.status)}`}>
                              {getStatusLabel(req.status)}
                            </span>
                          </td>
                          <td className="text-xs text-gray-600">
                            {req.status === 'APPROVED' ? req.approvedAt : 
                             req.status === 'REJECTED' ? req.rejectedAt : 
                             '—'}
                          </td>
                          <td className="text-xs">
                            {req.status === 'REJECTED' && req.rejectionReason ? (
                              <details className="cursor-pointer">
                                <summary className="font-semibold text-red-600 hover:underline">
                                  Ver motivo
                                </summary>
                                <div className="mt-2 p-2 bg-red-50 rounded border border-red-200 text-red-700 text-xs">
                                  {req.rejectionReason}
                                </div>
                              </details>
                            ) : req.status === 'APPROVED' ? (
                              <span className="text-green-600 font-semibold">✓ Aprobada</span>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="7" className="text-center py-8 text-gray-500">
                        No hay solicitudes en el historial
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default AccountRequestsHistoryView;
