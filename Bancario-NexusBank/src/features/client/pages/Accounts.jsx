import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useClientStore } from '../store/useClientStore.js';
import { useAuthStore } from '../../auth/store/authStore.js';
import { clientAccountService } from '../../../shared/api/clientAccount.service.js';
import '../../../styles/accounts.css';
import NewAccountRequestModal from '../components/NewAccountRequestModal.jsx';
 
const getAccountTypeLabel = (account) => {
  const rawType = String(account?.accountType || account?.type || account?.name || '').trim().toLowerCase();
  if (!rawType) return 'Cuenta';
  if (rawType.includes('corrient') || rawType.includes('monetar')) return 'Cuenta Corriente';
  if (rawType.includes('ahor')) return 'Cuenta de Ahorros';
  if (rawType.startsWith('cuenta')) return rawType.charAt(0).toUpperCase() + rawType.slice(1);
  return `Cuenta ${rawType}`;
};
 
const getAccountAccentColor = (account) => {
  const label = getAccountTypeLabel(account).toLowerCase();
  if (label.includes('corriente')) return '#2D5899';
  if (label.includes('ahorro')) return '#C8A84B';
  return '#1A6637';
};
 
const getAccountIcon = (account) => {
  const label = getAccountTypeLabel(account).toLowerCase();
  if (label.includes('corriente')) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="4" width="12" height="9" rx="1.5" stroke="#2D5899" strokeWidth="1.2"/>
        <path d="M2 8h12" stroke="#2D5899" strokeWidth="1.2"/>
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="6" width="12" height="8" rx="1.5" stroke="#C8A84B" strokeWidth="1.2"/>
      <path d="M5 6V4a3 3 0 0 1 6 0v2" stroke="#C8A84B" strokeWidth="1.2"/>
    </svg>
  );
};
 
const TxIcon = ({ type }) => {
  const isOut = ['RETIRO', 'TRANSFERENCIA_ENVIADA', 'COMPRA'].includes(type);
  return isOut ? (
    <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
      <path d="M2 7h10M8 3l4 4-4 4" stroke="#7A1A1A" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ) : (
    <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
      <path d="M7 2v10M3 6l4-4 4 4" stroke="#1A6637" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
};
 
const Accounts = () => {
  const { accounts, mainAccount, userProfile, fetchAllAccounts, fetchMainAccount, loading } = useClientStore();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const [selected, setSelected] = useState(null);
  const [recentTx, setRecentTx] = useState([]);
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);

  const selectedAccountIdFromRoute = new URLSearchParams(location.search).get('accountId');
 
  useEffect(() => {
    const init = async () => {
      await fetchAllAccounts();
      await fetchMainAccount();
      const txs = await clientAccountService.getRecentTransactions(50).catch(() => []);
      setRecentTx(txs || []);
    };
    init();
  }, [fetchAllAccounts, fetchMainAccount]);
 
  useEffect(() => {
    const routeTarget = selectedAccountIdFromRoute
      ? [...(accounts || []), mainAccount].find((account) => {
          if (!account) return false;
          return String(account.id) === String(selectedAccountIdFromRoute)
            || String(account.accountNumber) === String(selectedAccountIdFromRoute);
        })
      : null;

    if (routeTarget) {
      setSelected(routeTarget);
      return;
    }

    if (!selected) {
      const primary = mainAccount || (accounts && accounts.length > 0 ? accounts[0] : null);
      if (primary) setSelected(primary);
    }
  }, [accounts, mainAccount, selectedAccountIdFromRoute, selected]);
 
  const handleSelect = (acc) => setSelected(acc);
 
  const filteredTransactions = (selected && recentTx.length > 0)
    ? recentTx.filter((t) => {
        const accNum = selected.accountNumber || selected.number || selected.account_number;
        return accNum && (
          t.accountNumber === accNum ||
          t.fromAccount === accNum ||
          t.toAccount === accNum ||
          t.accountId === selected.id ||
          t.accountId === selected.accountId
        );
      })
    : [];

  // separar transferencias y depósitos (máximo 3 de cada en la vista)
  const accountTx = filteredTransactions || [];
  const transfers = accountTx.filter((t) => {
    const type = String(t.type || '').toLowerCase();
    return type.includes('transfer') || ['transferencia_enviada','transferencia_recibida','transferencia'].includes(type);
  });
  const deposits = accountTx.filter((t) => {
    const type = String(t.type || '').toLowerCase();
    return type.includes('dep') || ['deposito','deposit'].includes(type);
  });

  const primaryAccount = mainAccount || (accounts.length > 0 ? accounts[0] : null);
  const secondaryAccounts = accounts.filter((account) => {
    if (!primaryAccount) return true;
    return String(account.id) !== String(primaryAccount.id) && String(account.accountNumber) !== String(primaryAccount.accountNumber);
  });

  const totalAccounts = primaryAccount
    ? secondaryAccounts.length + 1
    : secondaryAccounts.length;
 
  const userName = user?.name || userProfile?.Name || user?.firstName || user?.username || '—';
  const userId = user?.id || userProfile?.id || userProfile?.UserId || userProfile?.userId || '—';
 
  const accountStatusLabel = (account) => {
    const s = String(account?.accountStatus || account?.status || '').toUpperCase();
    if (s === 'FROZEN') return 'Congelada';
    if (s === 'SUSPENDED') return 'Suspendida';
    if (s === 'BLOCKED') return 'Bloqueada';
    if (s === 'CLOSED') return 'Cerrada';
    if (s === 'UNDER_REVIEW') return 'En revisión';
    return 'Activa';
  };

  const accountBadgeClass = (account) => {
    const s = String(account?.accountStatus || account?.status || '').toUpperCase();
    if (['FROZEN','SUSPENDED','BLOCKED'].includes(s)) return 'acct-badge--pending';
    return 'acct-badge--active';
  };

  return (
    <div className="accounts-page animate-fade-in-up">
 
      {/* Header con identificador protegido */}
      <div className="accounts-header">
        <div>
          <h2 className="accounts-title">Mis cuentas</h2>
          <p className="accounts-sub">Todas las cuentas asociadas a tu usuario</p>
        </div>
    
      </div>
 
     
 
      <div className="accounts-layout">
 
        {/* Columna izquierda — lista de cuentas */}
        <div className="accounts-left">
          {loading && (
            <p className="accounts-empty">Cargando cuentas...</p>
          )}
 
          {!loading && accounts.length === 0 && (
            <p className="accounts-empty">No hay cuentas disponibles.</p>
          )}

          {!loading && primaryAccount && (
            <div
              onClick={() => handleSelect(primaryAccount)}
              className={`acct-card acct-card--selected`}
              style={{ '--accent': '#C8A84B' }}
            >
              <div className="acct-card__bar" style={{ background: '#C8A84B' }}></div>
              <div className="acct-card__corner" style={{ background: '#FEF9ED' }}>
                {getAccountIcon(primaryAccount)}
              </div>
              <div className="acct-card__type">{getAccountTypeLabel(primaryAccount)} (Principal)</div>
              <div className="acct-card__num">
                {primaryAccount.accountNumber || primaryAccount.number || '**** **** **** ****'}
              </div>
              <div className="acct-card__saldo-lbl">Saldo disponible</div>
              <div className="acct-card__saldo">
                Q {(primaryAccount.accountBalance || primaryAccount.balance || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
              </div>
              <div className="acct-card__foot">
                <span className={`acct-badge ${accountBadgeClass(primaryAccount)}`}>
                  {accountStatusLabel(primaryAccount)}
                </span>
              </div>
            </div>
          )}
 
          {secondaryAccounts.map((acc) => {
            const isSelected = selected && (selected.id === acc.id || selected.accountNumber === acc.accountNumber);
            const accent = getAccountAccentColor(acc);
            const iconBg = accent === '#2D5899' ? '#EDF2FA' : accent === '#C8A84B' ? '#FEF9ED' : '#E6F4ED';
            return (
              <div
                key={acc.id || acc.accountNumber || acc.accountId}
                onClick={() => handleSelect(acc)}
                className={`acct-card ${isSelected ? 'acct-card--selected' : ''}`}
                style={{ '--accent': accent }}
              >
                <div className="acct-card__bar" style={{ background: accent }}></div>
                <div className="acct-card__corner" style={{ background: iconBg }}>
                  {getAccountIcon(acc)}
                </div>
                <div className="acct-card__type">{getAccountTypeLabel(acc)}</div>
                <div className="acct-card__num">
                  {acc.accountNumber || acc.number || '**** **** **** ****'}
                </div>
                <div className="acct-card__saldo-lbl">Saldo disponible</div>
                <div className="acct-card__saldo">
                  Q {(acc.accountBalance || acc.balance || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                </div>
                <div className="acct-card__foot">
                  <span className={`acct-badge ${accountBadgeClass(acc)}`}>
                    {accountStatusLabel(acc)}
                  </span>
                </div>
              </div>
            );
          })}
 
          {/* Tarjeta nueva cuenta */}
          <div className="acct-card acct-card--new" onClick={() => setShowNewAccountModal(true)}>
            <div className="acct-card--new__icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke="#4A7AAA" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="acct-card--new__label">Abrir nueva cuenta</div>
            <div className="acct-card--new__sub">Ahorros o corriente</div>
          </div>
          <NewAccountRequestModal
            visible={showNewAccountModal}
            onClose={(ok) => { setShowNewAccountModal(false); if (ok) fetchAllAccounts(); }}
            defaultUserId={user?.id || userProfile?.id || userProfile?.UserId || userProfile?.userId}
          />
        </div>
 
        {/* Columna derecha — detalle */}
        <div className="accounts-right">
          {selected ? (
            <>
              <div className="detail-card">
                {/* Header del detalle */}
                <div className="detail-card__hd">
                  <div>
                    <div className="detail-card__type">{getAccountTypeLabel(selected)}</div>
                    <div className="detail-card__num">
                      {selected.accountNumber || selected.number || '**** **** ****'}
                    </div>
                    <div className="detail-card__titular">Titular: {userName}</div>
                  </div>
                  <div className="detail-card__saldo-wrap">
                    <div className="detail-card__saldo-lbl">Saldo disponible</div>
                    <div className="detail-card__saldo">
                      Q {(selected.accountBalance || selected.balance || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
 
                {/* Stats ingresos/gastos */}
                <div className="detail-stats">
                  <div className="detail-stat">
                    <div className="detail-stat__lbl">Ingresos mes</div>
                    <div className="detail-stat__val detail-stat__val--pos">
                      +Q {filteredTransactions
                        .filter(t => !['RETIRO','TRANSFERENCIA_ENVIADA','COMPRA'].includes(t.type))
                        .reduce((s, t) => s + Math.abs(t.amount || 0), 0)
                        .toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="detail-stat">
                    <div className="detail-stat__lbl">Gastos mes</div>
                    <div className="detail-stat__val detail-stat__val--neg">
                      -Q {filteredTransactions
                        .filter(t => ['RETIRO','TRANSFERENCIA_ENVIADA','COMPRA'].includes(t.type))
                        .reduce((s, t) => s + Math.abs(t.amount || 0), 0)
                        .toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
 
                <div className="detail-cols">
                  {/* Transferencias */}
                  <div>
                    <div className="detail-sec">Últimas transferencias</div>
                    {transfers.length > 0 ? (
                      transfers.slice(0, 3).map((tx, i) => {
                        const isOut = ['RETIRO','TRANSFERENCIA_ENVIADA','COMPRA'].includes((tx.type || '').toUpperCase());
                        return (
                          <div key={i} className="tx-row">
                            <div className="tx-row__left">
                              <div className={`tx-ico ${isOut ? 'tx-ico--out' : 'tx-ico--in'}`}>
                                <TxIcon type={tx.type} />
                              </div>
                              <div>
                                <div className="tx-title">{tx.description || tx.concept || 'Transferencia'}</div>
                                <div className="tx-meta">
                                  {(tx.date || tx.createdAt) ? new Date(tx.date || tx.createdAt).toLocaleDateString('es-GT') : ''}
                                </div>
                              </div>
                            </div>
                            <span className={`tx-amt ${isOut ? 'tx-amt--neg' : 'tx-amt--pos'}`}>
                              {isOut ? '-' : '+'}Q {Math.abs(tx.amount || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="detail-empty">No hay transferencias recientes.</p>
                    )}

                    {/* Últimos depósitos (máximo 3) */}
                    <div style={{marginTop:16}}>
                      <div className="detail-sec">Últimos depósitos</div>
                      {deposits.length > 0 ? (
                        deposits.slice(0,3).map((tx, i) => (
                          <div key={`dep-${i}`} className="tx-row">
                            <div className="tx-row__left">
                              <div className={`tx-ico tx-ico--in`}>
                                <TxIcon type={tx.type} />
                              </div>
                              <div>
                                <div className="tx-title">{tx.description || tx.concept || 'Depósito'}</div>
                                <div className="tx-meta">{(tx.date || tx.createdAt) ? new Date(tx.date || tx.createdAt).toLocaleDateString('es-GT') : ''}</div>
                              </div>
                            </div>
                            <span className={`tx-amt tx-amt--pos`}>+Q {Math.abs(tx.amount || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</span>
                          </div>
                        ))
                      ) : (
                        <p className="detail-empty">No hay depósitos recientes.</p>
                      )}
                    </div>
                  </div>
 
                  {/* Info de cuenta */}
                  <div>
                    <div className="detail-sec">Información de la cuenta</div>
                    <div className="info-box">
                      <div className="info-row"><span className="info-key">Titular</span><span className="info-val">{userName}</span></div>
                      <div className="info-row"><span className="info-key">ID de usuario</span><span className="info-val info-val--email">{userId}</span></div>
                      <div className="info-row"><span className="info-key">Tipo</span><span className="info-val">{getAccountTypeLabel(selected)}</span></div>
                      <div className="info-row">
                        <span className="info-key">Apertura</span>
                        <span className="info-val">
                          {selected.createdAt ? new Date(selected.createdAt).toLocaleDateString('es-GT') : selected.openedAt ? new Date(selected.openedAt).toLocaleDateString('es-GT') : '—'}
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="info-key">Estado</span>
                        <span className="info-val info-val--active">{accountStatusLabel(selected)}</span>
                      </div>
                    </div>
                  </div>
                </div>
 
                {/* Botones */}
                <div className="detail-btns">
                  <button
                    className="detail-btn detail-btn--primary"
                    type="button"
                    onClick={() => navigate('/clientdashboard/transfers')}
                  >
                    Transferir
                  </button>
                  <button
                    className="detail-btn detail-btn--secondary"
                    type="button"
                    onClick={() => navigate('/clientdashboard/deposits')}
                  >
                    Depositar
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="detail-empty-state">
              <p>Selecciona una cuenta para ver sus detalles.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
 
export default Accounts;