import { useEffect, useState } from 'react';
import { useClientStore } from '../store/useClientStore.js';
import { clientAccountService } from '../../../shared/api/clientAccount.service.js';
import TransactionDetail from '../components/TransactionDetail.jsx';
import '../../../styles/accountHistory.css';
import { Card } from '@material-tailwind/react';
import { FaSearch, FaFilter, FaDownload, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const TRANSACTION_TYPES = [
  { value: 'DEPOSITO', label: 'Depósito' },
  { value: 'TRANSFERENCIA_ENVIADA', label: 'Transferencia Enviada' },
  { value: 'TRANSFERENCIA_RECIBIDA', label: 'Transferencia Recibida' }
];

const TRANSACTION_STATUS = [
  { value: 'COMPLETADA', label: 'Completado', color: '#1A6637' },
  { value: 'PENDIENTE', label: 'Pendiente', color: '#E8D8A0' },
  { value: 'FALLIDA', label: 'Rechazado', color: '#7A1A1A' },
  { value: 'REVERTIDA', label: 'Revertido', color: '#d63a3a' }
];

const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '—';
  const num = parseFloat(amount);
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'GTQ'
  }).format(num);
};

const getTransactionIcon = (type, isReverted) => {
  const isOut = ['RETIRO', 'TRANSFERENCIA_ENVIADA', 'COMPRA'].includes(type);
  const color = isReverted ? '#d63a3a' : isOut ? '#7A1A1A' : '#1A6637';
  
  if (isOut) {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color }}>
        <path d="M2 8h10M9 3l4 5-4 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color }}>
      <path d="M8 2v10M4 6l4-4 4 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

const getStatusColor = (status, isReverted) => {
  if (isReverted) return '#d63a3a';
  const statusObj = TRANSACTION_STATUS.find(s => s.value === status);
  return statusObj?.color || '#6b7280';
};

const getTypeLabel = (type) => {
  const typeObj = TRANSACTION_TYPES.find(t => t.value === type);
  return typeObj?.label || type;
};

export default function AccountHistory() {
  const { accounts, accountHistory, historyLoading, historyError, fetchAccountHistory, fetchAllAccounts } = useClientStore();
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    startDate: '',
    endDate: '',
    searchTerm: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Inicializar con primera cuenta
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(String(accounts[0].id));
    }
  }, [accounts, selectedAccountId]);

  useEffect(() => {
    if (accounts.length === 0) {
      fetchAllAccounts();
    }
  }, [accounts.length, fetchAllAccounts]);

  // Cargar historial cuando cambien filtros o página
  useEffect(() => {
    if (!selectedAccountId) return;

    const loadHistory = async () => {
      await fetchAccountHistory({
        accountId: selectedAccountId,
        page: currentPage,
        limit: 10,
        type: filters.type || undefined,
        status: filters.status || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined
      });
    };

    loadHistory();
  }, [selectedAccountId, filters, currentPage, fetchAccountHistory]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset a página 1
  };

  const handleResetFilters = () => {
    setFilters({
      type: '',
      status: '',
      startDate: '',
      endDate: '',
      searchTerm: ''
    });
    setCurrentPage(1);
  };

  const handleSelectTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };

  const handleDownloadPDF = (transaction) => {
    // Implementado en TransactionDetail
  };

  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);
  const { transactions = [], pagination = {}, summary = {} } = accountHistory;

  // Filtrar transacciones por búsqueda si existe searchTerm
  let filteredTransactions = transactions;
  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    filteredTransactions = transactions.filter(t =>
      t.description?.toLowerCase().includes(term) ||
      t.accountNumber?.includes(term) ||
      t.relatedAccountNumber?.includes(term) ||
      t.id?.includes(term)
    );
  }

  return (
    <div className="account-history-page animate-fade-in-up">
      {/* Header */}
      <div className="history-header">
        <div>
          <h2 className="history-title">Historial de mi cuenta</h2>
          <p className="history-sub">Visualiza todos los movimientos realizados</p>
        </div>
      </div>

      {/* Selector de cuenta y resumen */}
      <div className="history-account-selector">
        <div className="account-select-wrapper">
          <label htmlFor="account-select" className="account-select-label">Cuenta</label>
          <select
            id="account-select"
            value={selectedAccountId || ''}
            onChange={(e) => {
                setSelectedAccountId(String(e.target.value));
              setCurrentPage(1);
            }}
            className="account-select"
          >
              {accounts.map(acc => (
                <option key={acc.id} value={String(acc.id)}>
                {acc.accountNumber || acc.number} - {acc.accountType || 'Cuenta'} - Q{parseFloat(acc.accountBalance || 0).toFixed(2)}
              </option>
            ))}
          </select>
        </div>

        {/* Resumen rápido */}
        {summary && (
          <div className="history-summary-cards">
            <div className="summary-card income">
              <div className="summary-label">Ingresos</div>
              <div className="summary-amount">{formatCurrency(summary.totalIncome)}</div>
            </div>
            <div className="summary-card expense">
              <div className="summary-label">Egresos</div>
              <div className="summary-amount">{formatCurrency(summary.totalExpense)}</div>
            </div>
            <div className="summary-card net">
              <div className="summary-label">Cambio neto</div>
              <div className="summary-amount">{formatCurrency(summary.netChange)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="history-controls">
        <div className="history-search-bar">
          <FaSearch className="history-search-icon" />
          <input
            type="text"
            placeholder="Buscar por descripción, referencia o cuenta..."
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            className="history-search-input"
          />
        </div>
        <button
          className="filter-toggle-btn"
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaFilter /> Filtros
        </button>
      </div>

      {/* Panel de filtros colapsable */}
      {showFilters && (
        <Card className="filters-panel">
          <div className="filters-grid">
            <div className="filter-group">
              <label htmlFor="filter-type" className="filter-label">Tipo de movimiento</label>
              <select
                id="filter-type"
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="filter-select"
              >
                <option value="">Todos</option>
                {TRANSACTION_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="filter-status" className="filter-label">Estado</label>
              <select
                id="filter-status"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="filter-select"
              >
                <option value="">Todos</option>
                {TRANSACTION_STATUS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="filter-start-date" className="filter-label">Desde</label>
              <input
                id="filter-start-date"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label htmlFor="filter-end-date" className="filter-label">Hasta</label>
              <input
                id="filter-end-date"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="filter-input"
              />
            </div>
          </div>

          <button
            className="reset-filters-btn"
            onClick={handleResetFilters}
          >
            Limpiar filtros
          </button>
        </Card>
      )}

      {/* Tabla de transacciones */}
      <Card className="transactions-card">
        {historyLoading && (
          <div className="loading-skeleton">
            <p>Cargando movimientos...</p>
          </div>
        )}

        {!historyLoading && historyError && (
          <div className="error-message">
            <p>{historyError}</p>
          </div>
        )}

        {!historyLoading && !historyError && filteredTransactions.length === 0 && (
          <div className="empty-state">
            <p>No hay movimientos registrados</p>
          </div>
        )}

        {!historyLoading && filteredTransactions.length > 0 && (
          <>
            <div className="transactions-table-wrapper">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Descripción</th>
                    <th>Monto</th>
                    <th>Cuenta relacionada</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(transaction => (
                    <tr key={transaction.id} className={transaction.isReverted ? 'reverted' : ''}>
                      <td className="type-cell">
                        <span className="type-icon">
                          {getTransactionIcon(transaction.type, transaction.isReverted)}
                        </span>
                        <span className="type-label">{getTypeLabel(transaction.type)}</span>
                      </td>
                      <td className="description-cell">
                        {transaction.description || '—'}
                      </td>
                      <td className="amount-cell">
                        <span className={transaction.type.includes('ENVIADA') || transaction.type === 'RETIRO' || transaction.type === 'COMPRA' ? 'expense' : 'income'}>
                          {transaction.type.includes('ENVIADA') || transaction.type === 'RETIRO' || transaction.type === 'COMPRA' ? '-' : '+'}
                          {formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="related-account-cell">
                        {transaction.relatedAccountNumber || '—'}
                      </td>
                      <td className="status-cell">
                        <span
                          className="status-badge"
                          style={{ 
                            borderColor: getStatusColor(transaction.status, transaction.isReverted),
                            color: getStatusColor(transaction.status, transaction.isReverted)
                          }}
                        >
                          {transaction.isReverted ? 'Revertido' : transaction.status}
                        </span>
                      </td>
                      <td className="date-cell">
                        {formatDate(transaction.createdAt)}
                      </td>
                      <td className="actions-cell">
                        <button
                          className="action-btn"
                          onClick={() => handleSelectTransaction(transaction)}
                          title="Ver detalles"
                        >
                          Detalles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {pagination.pages > 1 && (
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                >
                  <FaChevronLeft /> Anterior
                </button>

                <div className="pagination-info">
                  Página {pagination.page || currentPage} de {pagination.pages}
                </div>

                <button
                  className="pagination-btn"
                  disabled={currentPage === pagination.pages}
                  onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                >
                  Siguiente <FaChevronRight />
                </button>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Modal de detalles */}
      {showDetailModal && selectedTransaction && (
        <TransactionDetail
          transaction={selectedTransaction}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTransaction(null);
          }}
        />
      )}
    </div>
  );
}
