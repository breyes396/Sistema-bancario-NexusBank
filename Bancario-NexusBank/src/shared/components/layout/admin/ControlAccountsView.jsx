import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from './AdminLayout.jsx';
import AdminPageHeader from './AdminPageHeader.jsx';
import { adminDashboardService } from '../../../api/adminDashboard.service.js';
import { getSupportRequests, updateSupportRequest } from '../../../utils/supportRequests.js';
import { showError, showSuccess } from '../../../utils/toast.js';
import '../../../../styles/adminDashboard.css';

const ADMIN_FREEZE_REASON = 'ADMINISTRATIVE_ACTION';

const statusLabel = (value) => {
  const normalized = String(value || '').toUpperCase();
  if (normalized === 'FROZEN') return 'Congelada';
  if (normalized === 'SUSPENDED') return 'Suspendida';
  if (normalized === 'BLOCKED') return 'Bloqueada';
  if (normalized === 'CLOSED') return 'Cerrada';
  if (normalized === 'UNDER_REVIEW') return 'En revisión';
  return 'Activa';
};

const statusClass = (value) => {
  const normalized = String(value || '').toUpperCase();
  if (['FROZEN', 'SUSPENDED', 'BLOCKED'].includes(normalized)) return 'badge-egreso';
  if (normalized === 'CLOSED') return 'badge-pendiente';
  if (normalized === 'UNDER_REVIEW') return 'badge-pendiente';
  return 'badge-ingreso';
};

const isBlockedAccount = (status) => ['FROZEN', 'SUSPENDED', 'BLOCKED'].includes(String(status || '').toUpperCase());
const isClosableAccount = (status) => ['ACTIVE', 'UNDER_REVIEW'].includes(String(status || '').toUpperCase());
const isVisibleAccount = (status) => String(status || '').toUpperCase() !== 'CLOSED';

const trimText = (text, max = 120) => {
  if (!text) return 'Sin descripción';
  return text.length > max ? `${text.slice(0, max).trim()}...` : text;
};

const formatDate = (value) => {
  if (!value) return 'No disponible';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No disponible';
  return date.toLocaleString('es-GT');
};

const SupportDetailCard = ({ request, accounts, onFreezeAll, onUnfreezeAll, loadingAction }) => {
  return (
    <div className="support-detail-card glass-panel">
      <div className="support-detail-header">
        <div>
          <div className="support-detail-eyebrow">Solicitud de soporte</div>
          <h3 className="support-detail-title">{request?.email || 'Correo no disponible'}</h3>
          <p className="support-detail-subtitle">{new Date(request?.createdAt || Date.now()).toLocaleString('es-GT')}</p>
        </div>
        <span className="status-badge badge-pendiente">{request?.status || 'OPEN'}</span>
      </div>

      <div className="support-description-box">
        <div className="support-description-label">Descripción</div>
        <p className="support-description-text">{request?.description || 'Sin descripción registrada'}</p>
      </div>

      <div className="support-matched-box">
        <div className="support-section-title">Cuentas asociadas</div>
        {accounts.length > 0 ? (
          <div className="support-account-list">
            {accounts.map((account) => (
              <div key={account.id} className="support-account-item">
                <div>
                  <div className="support-account-number">{account.accountNumber}</div>
                  <div className="support-account-meta">{account.accountType} · {account.ownerName || request?.email || 'Cliente'}</div>
                  <div className="support-account-meta">Creada: {formatDate(account.createdAt)} · Apertura: {formatDate(account.openedAt)}</div>
                </div>
                <span className={`status-badge ${statusClass(account.accountStatus)}`}>
                  {statusLabel(account.accountStatus)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="support-empty-box">No hay cuentas asociadas con este correo.</div>
        )}
      </div>

      <div className="support-action-row">
        <button
          type="button"
          className="support-action-btn support-action-btn-freeze"
          disabled={loadingAction || accounts.length === 0}
          onClick={onFreezeAll}
        >
          Congelar cuentas
        </button>
        <button
          type="button"
          className="support-action-btn support-action-btn-unfreeze"
          disabled={loadingAction || accounts.length === 0}
          onClick={onUnfreezeAll}
        >
          Descongelar cuentas
        </button>
      </div>
    </div>
  );
};

const ControlAccountsView = () => {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loadingAction, setLoadingAction] = useState(false);
  const [users, setUsers] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accountsRes, usersRes] = await Promise.all([
        adminDashboardService.getAccounts(),
        adminDashboardService.getUsers(),
      ]);

      const storedRequests = getSupportRequests();
      setAccounts(accountsRes.data || []);
      setUsers(usersRes?.data?.items || []);
      setRequests(storedRequests);

      if (!selectedRequestId && storedRequests.length > 0) {
        setSelectedRequestId(storedRequests[0].id);
      }
    } catch (error) {
      console.error(error);
      showError('No se pudo cargar el control de cuentas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleStorage = (event) => {
      if (event.key === 'nexusbank_support_requests') {
        setRequests(getSupportRequests());
      }
    };

    const handleSupportUpdate = () => {
      setRequests(getSupportRequests());
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('nexusbank-support-updated', handleSupportUpdate);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('nexusbank-support-updated', handleSupportUpdate);
    };
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesQuery = !normalizedQuery || [request.email, request.description].join(' ').toLowerCase().includes(normalizedQuery);
      const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [requests, normalizedQuery, statusFilter]);

  const selectedRequest = filteredRequests.find((request) => request.id === selectedRequestId) || filteredRequests[0] || null;

  const selectedEmail = String(selectedRequest?.email || '').toLowerCase();

  const normalizedUsers = useMemo(() => {
    return users.map((user) => {
      const profile = user.profile || user.UserProfile || {};
      const userAccounts = user.Accounts || user.accounts || [];
      return {
        id: user.id,
        email: String(user.email || '').toLowerCase(),
        name: profile.name || user.email || 'Usuario',
        username: profile.username || user.email || 'Usuario',
        phone: profile.phoneNumber || 'N/A',
        dpi: profile.documentNumber || 'N/A',
        job: profile.jobName || 'N/A',
        income: profile.income || 0,
        accounts: userAccounts,
      };
    });
  }, [users]);

  const resolveUserForRequest = (request) => {
    if (!request) return null;

    const requestUserId = request.userId ? String(request.userId) : null;
    const requestEmail = String(request.email || '').toLowerCase();

    if (requestUserId) {
      return normalizedUsers.find((user) => String(user.id) === requestUserId) || null;
    }

    if (requestEmail) {
      return normalizedUsers.find((user) => user.email === requestEmail) || null;
    }

    return null;
  };

  const matchedUser = useMemo(() => resolveUserForRequest(selectedRequest), [normalizedUsers, selectedRequest]);
  const matchedUserId = matchedUser?.id ? String(matchedUser.id) : null;

  const matchedAccounts = useMemo(() => {
    if (matchedUserId) {
      return accounts
        .filter((account) => String(account.userId) === matchedUserId && isVisibleAccount(account.accountStatus))
        .map((account) => ({
          ...account,
          ownerName: matchedUser?.name || selectedRequest?.email || 'Cliente',
        }));
    }

    return accounts
      .filter((account) => String(account?.User?.email || '').toLowerCase() === selectedEmail && isVisibleAccount(account.accountStatus))
      .map((account) => ({
        ...account,
        ownerName: account?.User?.profile?.name || selectedRequest?.email || 'Cliente',
      }));
  }, [accounts, matchedUserId, matchedUser?.name, selectedEmail, selectedRequest?.email]);

  const frozenCount = matchedAccounts.filter((account) => String(account.accountStatus || '').toUpperCase() === 'FROZEN').length;

  const handleSelect = (requestId) => {
    setSelectedRequestId(requestId);
  };

  const applyActionToAccounts = async (action) => {
    if (!selectedRequest) return;

    if (matchedAccounts.length === 0) {
      showError('No hay cuentas asociadas para esta solicitud');
      return;
    }

    setLoadingAction(true);
    try {
      const targetAccounts = action === 'freeze'
        ? matchedAccounts.filter((account) => isClosableAccount(account.accountStatus))
        : matchedAccounts.filter((account) => isBlockedAccount(account.accountStatus));

      const skippedAccounts = matchedAccounts.length - targetAccounts.length;

      if (targetAccounts.length === 0) {
        showError(action === 'freeze'
          ? 'No hay cuentas activas o en revisión para congelar'
          : 'No hay cuentas congeladas o bloqueadas para descongelar');
        return;
      }

      const operations = targetAccounts.map((account) => {
        const payload = {
          reason: ADMIN_FREEZE_REASON,
          reasonDetails: `Control de cuentas: ${selectedRequest.description}`,
        };

        if (action === 'freeze') {
          return adminDashboardService.freezeAccount(account.id, payload);
        }

        if (action === 'unfreeze') {
          return adminDashboardService.unfreezeAccount(account.id, payload);
        }

        return Promise.resolve(null);
      });

      const results = await Promise.allSettled(operations);
      const rejectedResults = results.filter((result) => result.status === 'rejected');

      if (rejectedResults.length === results.length) {
        throw rejectedResults[0]?.reason || new Error('No fue posible completar la acción');
      }

      updateSupportRequest(selectedRequest.id, {
        status: 'RESOLVED',
        resolvedAt: new Date().toISOString(),
        resolution: action,
      });

      if (rejectedResults.length > 0 || skippedAccounts > 0) {
        showSuccess(
          action === 'freeze'
            ? `Se procesaron ${results.length - rejectedResults.length} cuenta(s). Se omitieron ${skippedAccounts} cerrada(s) o no aplicables.`
            : `Se procesaron ${results.length - rejectedResults.length} cuenta(s). Se omitieron ${skippedAccounts} no bloqueadas.`
        );
      } else {
        showSuccess(action === 'freeze' ? 'Cuentas congeladas correctamente' : 'Cuentas descongeladas correctamente');
      }
      await fetchData();
    } catch (error) {
      showError(error.response?.data?.message || 'No fue posible completar la acción');
    } finally {
      setLoadingAction(false);
    }
  };

  const totalFrozen = accounts.filter((account) => ['FROZEN', 'SUSPENDED', 'BLOCKED'].includes(String(account.accountStatus || '').toUpperCase())).length;

  return (
    <AdminLayout>
      <section className="admin-section">
        <AdminPageHeader
          title="Control de cuentas"
          description="Solicitudes enviadas desde soporte, cuentas asociadas y acciones rápidas para congelar o descongelar por cliente."
          breadcrumbs={[
            { label: 'Admin', to: '/AdminDashboard' },
            { label: 'Control de cuentas' },
          ]}
        />

        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-label">Solicitudes registradas</div>
            <div className="stat-value">{requests.length}</div>
          </div>
          <div className="stat-card light-blue">
            <div className="stat-label">Cuentas asociadas</div>
            <div className="stat-value">{accounts.length}</div>
          </div>
          <div className="stat-card light-red">
            <div className="stat-label">Cuentas congeladas</div>
            <div className="stat-value">{totalFrozen}</div>
          </div>
        </div>

        <div className="support-control-toolbar glass-panel">
          <input
            className="search-input support-search-input"
            type="text"
            placeholder="Buscar por correo o descripción"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Todas</option>
            <option value="OPEN">Abiertas</option>
            <option value="RESOLVED">Resueltas</option>
          </select>
          <button type="button" className="support-refresh-btn" onClick={fetchData}>
            Refrescar
          </button>
        </div>

        <div className="support-control-grid">
          <div className="support-ticket-list glass-panel">
            <div className="support-list-header">
              <h3 className="section-title">Solicitudes de soporte</h3>
              <span className="support-list-count">{filteredRequests.length}</span>
            </div>

            {loading ? (
              <div className="empty-message">Cargando solicitudes...</div>
            ) : filteredRequests.length > 0 ? (
              <div className="support-ticket-items">
                {filteredRequests.map((request) => {
                  const requestUser = resolveUserForRequest(request);
                  const requestUserId = requestUser?.id ? String(requestUser.id) : (request.userId ? String(request.userId) : null);
                  const requestAccounts = requestUserId
                    ? accounts.filter((account) => String(account.userId) === requestUserId && isVisibleAccount(account.accountStatus))
                    : accounts.filter((account) => String(account?.User?.email || '').toLowerCase() === String(request.email || '').toLowerCase() && isVisibleAccount(account.accountStatus));
                  const activeCount = requestAccounts.filter((account) => String(account.accountStatus || '').toUpperCase() === 'ACTIVE').length;
                  const accountCountLabel = requestUser ? `${requestAccounts.length} cuenta(s) asociadas` : `${requestAccounts.length} cuenta(s) vinculadas`;

                  return (
                    <div
                      key={request.id}
                      className={`support-ticket-card ${selectedRequestId === request.id ? 'active' : ''}`}
                      onClick={() => handleSelect(request.id)}
                    >
                      <div className="support-ticket-top">
                        <div>
                          <div className="support-ticket-email">{request.email}</div>
                          <div className="support-ticket-date">{new Date(request.createdAt).toLocaleString('es-GT')}</div>
                        </div>
                        <span className="status-badge badge-pendiente">{request.status}</span>
                      </div>

                      <p className="support-ticket-preview">{trimText(request.description, 120)}</p>

                      <div className="support-ticket-meta">
                        <span>{accountCountLabel}</span>
                        <span>{activeCount} activas</span>
                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-message">No hay solicitudes para mostrar.</div>
            )}
          </div>

          <div className="support-detail-column">
            {selectedRequest ? (
              <SupportDetailCard
                request={selectedRequest}
                accounts={matchedAccounts}
                loadingAction={loadingAction}
                onFreezeAll={() => applyActionToAccounts('freeze')}
                onUnfreezeAll={() => applyActionToAccounts('unfreeze')}
              />
            ) : (
              <div className="support-detail-placeholder glass-panel">
                <h3 className="section-title">Selecciona una solicitud</h3>
                <p className="support-placeholder-text">
                  Aquí verás el correo, la descripción del problema y las cuentas del cliente para congelar o descongelar con un clic.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </AdminLayout>
  );
};

export default ControlAccountsView;
