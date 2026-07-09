import React, { useEffect, useState, useRef } from 'react';
import { adminDashboardService } from '../../../api/adminDashboard.service.js';
import { showError, showSuccess } from '../../../utils/toast.js';
import { useNavigate } from 'react-router-dom';
import { FaBell } from 'react-icons/fa';
import ConfirmModal from '../../../components/ConfirmModal.jsx';

const AdminNotifications = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState(null);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  const fetchPending = async () => {
    try {
      setLoading(true);
      const response = await adminDashboardService.getPendingAccountRequests();
      const requests = response.data || [];
      setPending(requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      console.error(err);
      showError('Error cargando solicitudes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  useEffect(() => {
    const handleOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const openConfirm = (action, req) => {
    setConfirmAction({ action, id: req.id, accountType: req.accountType });
  };

  const closeConfirm = () => setConfirmAction(null);

  const handleConfirm = async () => {
    if (!confirmAction) return;

    try {
      if (confirmAction.action === 'approve') {
        await adminDashboardService.approveAccountRequest(confirmAction.id);
        showSuccess('Solicitud aprobada - Cuenta creada');
      } else {
        await adminDashboardService.rejectAccountRequest(confirmAction.id);
        showSuccess('Solicitud rechazada');
      }
      closeConfirm();
      fetchPending();
    } catch (e) {
      showError(e.response?.data?.message || (confirmAction.action === 'approve' ? 'Error al aprobar' : 'Error al rechazar'));
    }
  };

  const badgeCount = pending.length;

  return (
    <div ref={wrapperRef} style={{ position: 'relative', marginRight: 12 }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-[#2D5899] transition bg-white/50 rounded-full shadow-sm hover-lift flex items-center justify-center"
        title="Solicitudes"
        style={{ border: 'none', cursor: 'pointer' }}
        aria-label="Solicitudes"
      >
        <FaBell className="w-5 h-5 text-gray-500 hover:text-[#2D5899]" />
        {badgeCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
        )}
      </button>

      {isOpen && (
        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 360, background: '#0b2b52', color: '#fff', borderRadius: 8, boxShadow: '0 8px 24px rgba(2,8,18,0.3)', zIndex: 60, padding: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontWeight: 700 }}>Solicitudes de apertura</div>
            <button onClick={() => { setIsOpen(false); navigate('/AdminDashboard/account-requests-history'); }} style={{ background: 'transparent', border: 'none', color: '#9fb3d6', cursor: 'pointer' }}>Ver todas</button>
          </div>

          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 16 }}>Cargando...</div>
            ) : pending.length === 0 ? (
              <div style={{ padding: 16 }}>No hay solicitudes pendientes.</div>
            ) : (
              pending.slice(0, 5).map(req => (
                <div key={req.id} style={{ display: 'flex', gap: 12, padding: '10px 12px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{req.accountType}</div>
                    <div style={{ fontSize: 12, color: '#9fb3d6' }}>Solicitado: {new Date(req.createdAt).toLocaleString()}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => openConfirm('approve', req)} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>Aprobar</button>
                    <button onClick={() => openConfirm('reject', req)} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>Rechazar</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.action === 'approve' ? 'Aprobar solicitud' : 'Rechazar solicitud'}
        message={confirmAction?.action === 'approve'
          ? `¿Deseas aprobar esta solicitud de apertura${confirmAction?.accountType ? ` (${confirmAction.accountType})` : ''}?`
          : `¿Deseas rechazar esta solicitud de apertura${confirmAction?.accountType ? ` (${confirmAction.accountType})` : ''}?`}
        confirmLabel={confirmAction?.action === 'approve' ? 'Aprobar' : 'Rechazar'}
        tone={confirmAction?.action === 'approve' ? 'primary' : 'danger'}
        onConfirm={handleConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
};

export default AdminNotifications;
