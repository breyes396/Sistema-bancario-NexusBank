import React, { useState, useEffect } from 'react';
import AdminNavbar from './AdminNavbar.jsx';
import AdminSidebar from './AdminSidebar.jsx';
import AdminAddUserModal from './AdminAddUserModal.jsx';
import ConfirmModal from '../../../components/ConfirmModal.jsx';
import { adminDashboardService } from '../../../api/adminDashboard.service.js';
import { showError, showSuccess } from '../../../utils/toast.js';
import '../../../../styles/adminDashboard.css';
import { FaCheckDouble, FaPlus } from 'react-icons/fa';

const PendingRequestsView = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('PENDIENTE');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const [requestsRes, accountsRes] = await Promise.all([
        adminDashboardService.getPendingAccountRequests(),
        adminDashboardService.getAccounts()
      ]);

      const reqData = requestsRes?.data || [];
      const accData = accountsRes?.data || [];

      const fromRequests = reqData.map(r => ({
        id: r.id,
        source: 'request',
        type: 'CUENTA',
        requestType: 'Apertura de Cuenta',
        userName: r.User?.email || r.userId || 'Cliente',
        amount: 'N/A',
        status: r.status === 'PENDING' ? 'PENDIENTE' : (r.status === 'REJECTED' ? 'RECHAZADA' : r.status),
        date: new Date(r.createdAt).toLocaleString(),
        raw: r
      }));

      const fromAccounts = (accData || [])
        .filter(acc => acc.accountStatus === 'UNDER_REVIEW')
        .map(acc => ({
          id: acc.id,
          source: 'account',
          type: 'CUENTA_EXISTENTE',
          requestType: 'Apertura de Cuenta (registro previo)',
          userName: acc.User?.email || acc.userId || 'Cliente',
          amount: 'N/A',
          status: 'PENDIENTE',
          date: new Date(acc.createdAt || acc.openedAt || Date.now()).toLocaleString(),
          raw: acc
        }));

      const combined = [...fromRequests, ...fromAccounts];
      setRequests(combined.sort((a, b) => new Date(b.raw.createdAt || b.raw.openedAt || 0) - new Date(a.raw.createdAt || a.raw.openedAt || 0)));
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

  const openConfirm = (action, req = null) => {
    setPendingConfirm({ action, req });
  };

  const closeConfirm = () => setPendingConfirm(null);

  const handleApprove = async (req) => {
    try {
      if (req.source === 'request') {
        await adminDashboardService.approveAccountRequest(req.id);
      } else if (req.source === 'account') {
        await adminDashboardService.approveAccount(req.id);
      } else {
        throw new Error('Tipo de elemento desconocido');
      }
      showSuccess('Cuenta aprobada exitosamente');
      fetchRequests();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al aprobar la cuenta');
    }
  };

  const handleApproveAll = async () => {
    const pendientes = filteredRequests.filter(r => r.status === 'PENDIENTE');
    if (pendientes.length === 0) {
      showError('No hay cuentas pendientes para aprobar.');
      return;
    }
    setLoading(true);
    let successCount = 0;
    let errorCount = 0;
    for (const req of pendientes) {
      try {
        if (req.source === 'request') await adminDashboardService.approveAccountRequest(req.id);
        else if (req.source === 'account') await adminDashboardService.approveAccount(req.id);
        successCount++;
      } catch (e) {
        errorCount++;
      }
    }
    if (successCount > 0) showSuccess(`${successCount} cuentas aprobadas exitosamente.`);
    if (errorCount > 0) showError(`Error al aprobar ${errorCount} cuentas.`);
    fetchRequests();
  };

  const handleReject = async (req) => {
    try {
      if (req.source === 'request') {
        await adminDashboardService.rejectAccountRequest(req.id);
      } else if (req.source === 'account') {
        await adminDashboardService.rejectAccount(req.id);
      } else {
        throw new Error('Tipo de elemento desconocido');
      }
      showSuccess('Cuenta rechazada exitosamente');
      fetchRequests();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al rechazar la cuenta');
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingConfirm) return;

    try {
      if (pendingConfirm.action === 'approveAll') {
        closeConfirm();
        await handleApproveAll();
        return;
      }

      const req = pendingConfirm.req;
      if (pendingConfirm.action === 'approve') {
        await handleApprove(req);
      } else if (pendingConfirm.action === 'reject') {
        await handleReject(req);
      }
      closeConfirm();
    } catch (error) {
      showError(error.response?.data?.message || 'No fue posible completar la acción');
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
              <h2 className="text-3xl font-bold text-[#1A2E52]">Solicitudes de Apertura de Cuenta</h2>
              <div className="flex gap-3">
                <button 
                  onClick={() => openConfirm('approveAll')}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-bold hover:shadow-lg transition transform hover:-translate-y-1 flex items-center gap-2"
                >
                  <FaCheckDouble /> Aceptar Todas
                </button>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-3 bg-gradient-to-r from-[#2D5899] to-[#1A2E52] text-white rounded-xl font-bold hover:shadow-lg transition transform hover:-translate-y-1 flex items-center gap-2"
                >
                  <FaPlus /> Agregar Usuario
                </button>
              </div>
            </div>
            
            <div className="movements-section glass-panel shadow-md rounded-2xl overflow-hidden border border-white/40">
              <div className="movements-header">
                <h3 className="movements-title">Lista de solicitudes</h3>
                <div className="filters-container">
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
                                onClick={() => openConfirm('approve', req)}
                                disabled={req.status !== 'PENDIENTE' && req.status !== 'RECHAZADA'}
                                className={`px-3 py-1.5 text-white rounded-lg text-xs font-bold transition-all shadow-sm transform ${(req.status === 'PENDIENTE' || req.status === 'RECHAZADA') ? 'bg-green-500 hover:bg-green-600 hover:shadow-md hover:-translate-y-0.5' : 'bg-gray-400 opacity-50 cursor-not-allowed'}`}
                              >
                                Aprobar
                              </button>
                              
                              {filterStatus !== 'RECHAZADA' && (
                                <button 
                                  onClick={() => openConfirm('reject', req)}
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

      <ConfirmModal
        open={!!pendingConfirm}
        title={pendingConfirm?.action === 'approveAll' ? 'Aceptar todas las solicitudes' : pendingConfirm?.action === 'approve' ? 'Aprobar solicitud' : 'Rechazar solicitud'}
        message={pendingConfirm?.action === 'approveAll'
          ? `¿Deseas aprobar todas las solicitudes pendientes (${filteredRequests.filter(r => r.status === 'PENDIENTE').length})?`
          : pendingConfirm?.action === 'approve'
            ? `¿Deseas aprobar la cuenta de ${pendingConfirm?.req?.userName || 'este usuario'}?`
            : `¿Deseas rechazar la cuenta de ${pendingConfirm?.req?.userName || 'este usuario'}?`}
        confirmLabel={pendingConfirm?.action === 'reject' ? 'Rechazar' : 'Aceptar'}
        tone={pendingConfirm?.action === 'reject' ? 'danger' : 'primary'}
        onConfirm={handleConfirmAction}
        onCancel={closeConfirm}
      />
    </div>
  );
};

export default PendingRequestsView;