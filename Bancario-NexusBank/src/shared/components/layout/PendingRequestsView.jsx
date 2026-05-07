import React, { useState, useEffect } from 'react';
import AdminNavbar from './AdminNavbar.jsx';
import AdminSidebar from './AdminSidebar.jsx';
import AdminAddUserModal from './AdminAddUserModal.jsx';
import { adminDashboardService } from '../../api/adminDashboard.service.js';
import { showError, showSuccess } from '../../utils/toast.js';
import '../../../styles/adminDashboard.css';

const PendingRequestsView = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('PENDIENTE');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const [accountsRes, depositsRes] = await Promise.all([
        adminDashboardService.getAccounts(),
        adminDashboardService.getDepositRequests()
      ]);

      const accData = accountsRes.data || [];
      const pendingAccounts = accData
        .filter(acc => ['UNDER_REVIEW', 'CLOSED'].includes(acc.accountStatus))
        .map(acc => ({
          id: acc.id,
          type: 'CUENTA',
          requestType: 'Apertura de Cuenta',
          userName: acc.User?.email || acc.userId || 'Cliente',
          amount: 'N/A',
          status: acc.accountStatus === 'UNDER_REVIEW' ? 'PENDIENTE' : 'RECHAZADA',
          date: new Date(acc.createdAt).toLocaleString(),
          raw: acc
        }));

      const depData = Array.isArray(depositsRes.data) ? depositsRes.data : [];
      const pendingDeposits = depData
        .filter(dep => ['PENDIENTE', 'RECHAZADA', 'FALLIDA'].includes(dep.status))
        .map(dep => ({
          id: dep.id,
          type: 'DEPOSITO',
          requestType: 'Depósito',
          userName: dep.account?.owner?.name || dep.accountInfo?.owner?.name || `Cuenta ${dep.accountId || ''}`,
          amount: `Q${Number(dep.amount).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`,
          status: dep.status,
          date: new Date(dep.createdAt).toLocaleString(),
          raw: dep
        }));

      setRequests([...pendingAccounts, ...pendingDeposits].sort((a, b) => new Date(b.raw.createdAt) - new Date(a.raw.createdAt)));
    } catch (error) {
      console.error(error);
      showError('Error al cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (req) => {
    if (!window.confirm(`¿Estás seguro de que deseas aprobar esta solicitud de ${req.userName}?`)) return;
    try {
      if (req.type === 'CUENTA') {
        await adminDashboardService.approveAccount(req.id);
        showSuccess('Cuenta aprobada exitosamente');
      } else {
        await adminDashboardService.approveDeposit(req.id);
        showSuccess('Depósito aprobado exitosamente');
      }
      fetchRequests();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al aprobar la solicitud');
    }
  };

  const handleApproveAll = async () => {
    const pendientes = filteredRequests.filter(r => r.status === 'PENDIENTE');
    if (pendientes.length === 0) {
      showError('No hay solicitudes pendientes para aprobar.');
      return;
    }
    if (!window.confirm(`¿Estás seguro de que deseas aprobar TODAS las solicitudes pendientes (${pendientes.length})?`)) return;
    
    setLoading(true);
    let successCount = 0;
    let errorCount = 0;
    for (const req of pendientes) {
      try {
        if (req.type === 'CUENTA') {
          await adminDashboardService.approveAccount(req.id);
        } else {
          await adminDashboardService.approveDeposit(req.id);
        }
        successCount++;
      } catch (e) {
        errorCount++;
      }
    }
    if (successCount > 0) showSuccess(`${successCount} solicitudes aprobadas exitosamente.`);
    if (errorCount > 0) showError(`Error al aprobar ${errorCount} solicitudes.`);
    fetchRequests();
  };

  const handleReject = async (req) => {
    if (!window.confirm(`¿Estás seguro de que deseas rechazar esta solicitud de ${req.userName}?`)) return;
    try {
      if (req.type === 'CUENTA') {
        await adminDashboardService.rejectAccount(req.id);
        showSuccess('Cuenta rechazada exitosamente');
      } else {
        await adminDashboardService.rejectDeposit(req.id);
        showSuccess('Depósito rechazado o revertido');
      }
      fetchRequests();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al rechazar la solicitud');
    }
  };

  // Filter
  const filteredRequests = requests.filter(r => {
    const searchStr = `${r.id} ${r.userName}`.toLowerCase();
    const matchSearch = searchStr.includes(searchTerm.toLowerCase());
    
    let matchStatus = false;
    if (filterStatus === 'PENDIENTE') matchStatus = r.status === 'PENDIENTE';
    if (filterStatus === 'RECHAZADA') matchStatus = ['RECHAZADA', 'FALLIDA'].includes(r.status);
    
    return matchSearch && matchStatus;
  });

  return (
    <div className="admin-dashboard animate-fade-in-up">
      <AdminNavbar />
      <div className="admin-container">
        <AdminSidebar />
        <main className="admin-main">
          <section className="admin-section">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-[#1A2E52]">Solicitudes Pendientes y Rechazadas</h2>
              <div className="flex gap-3">
                <button 
                  onClick={handleApproveAll}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-bold hover:shadow-lg transition transform hover:-translate-y-1 flex items-center gap-2"
                >
                  <span>✓✓</span> Aceptar Todas
                </button>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-3 bg-gradient-to-r from-[#2D5899] to-[#1A2E52] text-white rounded-xl font-bold hover:shadow-lg transition transform hover:-translate-y-1 flex items-center gap-2"
                >
                  <span>➕</span> Agregar Usuario
                </button>
              </div>
            </div>
            
            <div className="movements-section glass-panel shadow-md rounded-2xl overflow-hidden border border-white/40">
              <div className="movements-header">
                <h3 className="movements-title">Lista de solicitudes</h3>
                <div className="filters-container">
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Buscar por ID o Nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <select
                    className="filter-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="PENDIENTE">Pendientes</option>
                    <option value="RECHAZADA">Rechazadas</option>
                  </select>
                </div>
              </div>

              <div className="table-wrapper">
                <table className="movements-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Tipo</th>
                      <th>Usuario</th>
                      <th>Fecha</th>
                      <th>Monto</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="7" className="text-center py-4">Cargando...</td></tr>
                    ) : filteredRequests.length > 0 ? (
                      filteredRequests.map((req) => (
                        <tr key={`${req.type}-${req.id}`}>
                          <td className="font-mono text-xs">{req.id}</td>
                          <td className="font-medium text-xs text-[#2D5899]">{req.requestType}</td>
                          <td className="font-semibold text-gray-700">{req.userName}</td>
                          <td className="date-column">{req.date}</td>
                          <td className="font-bold">{req.amount}</td>
                          <td>
                            <span className={`status-badge ${req.status === 'PENDIENTE' ? 'badge-pendiente' : 'badge-egreso'}`}>
                              {req.status}
                            </span>
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleApprove(req)}
                                disabled={req.status !== 'PENDIENTE' && req.status !== 'RECHAZADA'}
                                className={`px-3 py-1.5 text-white rounded-lg text-xs font-bold transition-all shadow-sm transform ${(req.status === 'PENDIENTE' || req.status === 'RECHAZADA') ? 'bg-green-500 hover:bg-green-600 hover:shadow-md hover:-translate-y-0.5' : 'bg-gray-400 opacity-50 cursor-not-allowed'}`}
                              >
                                Aprobar
                              </button>
                              
                              {filterStatus !== 'RECHAZADA' && (
                                <button 
                                  onClick={() => handleReject(req)}
                                  disabled={req.status !== 'PENDIENTE'}
                                  className={`px-3 py-1.5 text-white rounded-lg text-xs font-bold transition-all shadow-sm transform ${req.status === 'PENDIENTE' ? 'bg-red-500 hover:bg-red-600 hover:shadow-md hover:-translate-y-0.5' : 'bg-gray-400 opacity-50 cursor-not-allowed'}`}
                                >
                                  Rechazar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="empty-message">No hay solicitudes que coincidan.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>
      </div>

      {isModalOpen && (
        <AdminAddUserModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={fetchRequests} 
        />
      )}
    </div>
  );
};

export default PendingRequestsView;
