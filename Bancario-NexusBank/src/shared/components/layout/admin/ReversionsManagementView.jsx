import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from './AdminLayout.jsx';
import AdminPageHeader from './AdminPageHeader.jsx';
import { getReversalRequests, updateReversalRequest } from '../../../utils/reversalRequests.js';
import RevertModal from '../../RevertModal.jsx';
import { adminDashboardService } from '../../../api/adminDashboard.service.js';
import { showError, showSuccess } from '../../../utils/toast.js';

const typeLabel = (type) => String(type || '').toUpperCase() === 'DEPOSITO' ? 'Depósito' : 'Transferencia';

const statusLabel = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'APPROVED') return 'Aprobada';
  if (normalized === 'REJECTED') return 'Rechazada';
  return 'Pendiente';
};

const statusClass = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'APPROVED') return 'badge-ingreso';
  if (normalized === 'REJECTED') return 'badge-egreso';
  return 'badge-pendiente';
};

const ReversionsManagementView = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const load = () => {
    const next = getReversalRequests();
    setItems(next.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  };

  useEffect(() => {
    load();

    const onUpdated = () => load();
    const onStorage = () => load();

    window.addEventListener('nexusbank-reversals-updated', onUpdated);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('nexusbank-reversals-updated', onUpdated);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const filtered = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();

    return items.filter((item) => {
      const byType = typeFilter === 'ALL' || String(item.type || '').toUpperCase() === typeFilter;
      const byStatus = statusFilter === 'ALL' || String(item.status || '').toUpperCase() === statusFilter;

      if (!byType || !byStatus) return false;

      if (!normalizedQuery) return true;

      const haystack = [
        item.reference,
        item.userEmail,
        item.userName,
        item.reason,
        item.operationDescription,
        item.accountNumber,
      ].join(' ').toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [items, search, statusFilter, typeFilter]);

  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveTarget, setResolveTarget] = useState(null);
  const [resolveNextStatus, setResolveNextStatus] = useState(null);

  const handleResolve = (item, nextStatus) => {
    if (!item || String(item.status).toUpperCase() !== 'PENDING') return;
    setResolveTarget(item);
    setResolveNextStatus(nextStatus);
    setShowResolveModal(true);
  };

  const handleResolveConfirm = async (comment) => {
    const item = resolveTarget;
    const nextStatus = resolveNextStatus;
    setShowResolveModal(false);
    setResolveTarget(null);
    setResolveNextStatus(null);

    if (!item) return;

    if (nextStatus === 'REJECTED' && !comment.trim()) {
      showError('Debes escribir un motivo de rechazo.');
      return;
    }

    if (nextStatus === 'APPROVED') {
      try {
        if (item.type === 'TRANSFERENCIA') {
          await adminDashboardService.revertTransfer(item.operationId, { reason: comment || item.reason });
        } else if (item.type === 'DEPOSITO') {
          await adminDashboardService.rejectDeposit(item.operationId);
        }
      } catch (err) {
        showError(err.response?.data?.message || 'Error al procesar la reversión en el servidor.');
        return;
      }
    }

    updateReversalRequest(item.id, {
      status: nextStatus,
      adminComment: comment.trim() || null,
      resolvedAt: new Date().toISOString(),
    });

    showSuccess(nextStatus === 'APPROVED' ? 'Reversión aprobada' : 'Reversión rechazada');
    load();
  };

  return (
    <AdminLayout>
      <section className="admin-section">
        <AdminPageHeader
          title="Control de Reversiones"
          description="Revisa, aprueba o rechaza solicitudes de reversión de depósitos y transferencias."
          breadcrumbs={[
            { label: 'Admin', to: '/AdminDashboard' },
            { label: 'Reversiones' },
          ]}
        />

        <div className="support-control-toolbar glass-panel">
          <input
            className="search-input support-search-input"
            type="text"
            placeholder="Buscar por correo, referencia o motivo"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className="filter-select"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            <option value="ALL">Todos los tipos</option>
            <option value="DEPOSITO">Depósitos</option>
            <option value="TRANSFERENCIA">Transferencias</option>
          </select>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">Todos los estados</option>
            <option value="PENDING">Pendientes</option>
            <option value="APPROVED">Aprobadas</option>
            <option value="REJECTED">Rechazadas</option>
          </select>
          <button type="button" className="support-refresh-btn" onClick={load}>
            Refrescar
          </button>
        </div>

        <div className="glass-panel" style={{ marginTop: 16, padding: 16, borderRadius: 16 }}>
          {filtered.length === 0 ? (
            <div className="empty-message">No hay solicitudes de reversión con los filtros actuales.</div>
          ) : (
            <div className="support-account-list">
              {filtered.map((item) => (
                <div key={item.id} className="support-account-item" style={{ alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div className="support-account-number">{typeLabel(item.type)} · REF {item.reference}</div>
                    <div className="support-account-meta">Cliente: {item.userEmail || 'Sin correo'} · Monto: Q {Number(item.amount || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</div>
                    <div className="support-account-meta">Motivo: {item.reason || 'Sin motivo'}</div>
                    <div className="support-account-meta">Fecha: {new Date(item.createdAt).toLocaleString('es-GT')}</div>
                    {item.adminComment && (
                      <div className="support-account-meta">Comentario admin: {item.adminComment}</div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                    <span className={`status-badge ${statusClass(item.status)}`}>
                      {statusLabel(item.status)}
                    </span>
                    {String(item.status).toUpperCase() === 'PENDING' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          className="support-action-btn support-action-btn-unfreeze"
                            onClick={() => handleResolve(item, 'APPROVED')}
                        >
                          Aprobar
                        </button>
                        <button
                          type="button"
                          className="support-action-btn support-action-btn-freeze"
                            onClick={() => handleResolve(item, 'REJECTED')}
                        >
                          Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      {showResolveModal && (
        <RevertModal
          open={showResolveModal}
          onClose={() => { setShowResolveModal(false); setResolveTarget(null); setResolveNextStatus(null); }}
          onConfirm={handleResolveConfirm}
          title={resolveNextStatus === 'APPROVED' ? 'Comentario para aprobar reversión (opcional)' : 'Motivo de rechazo de la reversión'}
          initialReason={resolveTarget?.adminComment || ''}
          createdAt={resolveTarget?.createdAt}
          disableTimeCheck={true}
          requireReason={resolveNextStatus === 'REJECTED'}
          okLabel={resolveNextStatus === 'APPROVED' ? 'Aprobar' : 'Rechazar'}
        />
      )}
    </AdminLayout>
  );
};

export default ReversionsManagementView;
