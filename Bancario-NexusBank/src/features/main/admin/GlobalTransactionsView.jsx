import React, { useEffect, useState } from 'react';
import { adminDashboardService } from '../../../shared/api/adminDashboard.service.js';
import { Card } from '@material-tailwind/react';
import { FaSearch, FaFilter, FaDownload, FaChevronLeft, FaChevronRight, FaFilePdf } from 'react-icons/fa';
import TransactionDetailModal from './TransactionDetailModal.jsx';
import AdminLayout from '../../../shared/components/layout/admin/AdminLayout.jsx';
import '../../../styles/accountHistory.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const TRANSACTION_TYPES = [
  { value: 'TRANSFERENCIA_ENVIADA', label: 'Transferencias' },
  { value: 'DEPOSITO', label: 'Depósitos' }
];

const TRANSACTION_STATUS = [
  { value: 'COMPLETADA', label: 'Aprobados' },
  { value: 'PENDIENTE', label: 'Pendientes' },
  { value: 'REVERTIDA', label: 'Revertidos' },
  { value: 'FALLIDA', label: 'Rechazados' }
];

const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
};

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '—';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'GTQ'
  }).format(parseFloat(amount));
};

export default function GlobalTransactionsView() {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalRecords: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    type: '',
    status: '',
    search: ''
  });
  const [searchInput, setSearchInput] = useState('');
  
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const fetchTransactions = async (page = 1, appliedFilters = filters) => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminDashboardService.getGlobalTransactions({
        page,
        limit: 10,
        type: appliedFilters.type || undefined,
        status: appliedFilters.status || undefined,
        search: appliedFilters.search || undefined
      });
      if (res.success) {
        setTransactions(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || 'Error cargando transacciones globales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(1, filters);
  }, [filters]);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      fetchTransactions(newPage, filters);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, search: searchInput }));
  };

const handleDownloadPDF = () => {
    const doc = new jsPDF('landscape');
    
    // Título y Logo / Header
    doc.setFontSize(18);
    doc.setTextColor(16, 43, 85); // Color #102b55
    doc.text("NexusBank - Historial Global de Transacciones", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha de generación: ${new Date().toLocaleString()}`, 14, 28);
    
    const tableColumn = ["Fecha", "Cuenta", "Usuario", "Tipo", "Monto", "Estado"];
    const tableRows = [];

    transactions.forEach(t => {
      const accInfo = t.accountInfo || {};
      const owner = accInfo.owner || {};
      const rowData = [
        formatDate(t.createdAt),
        accInfo.accountNumber || 'N/A',
        owner.name || owner.email || 'N/A',
        t.type,
        formatCurrency(t.amount),
        t.status
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [16, 43, 85], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 9, cellPadding: 3 }
    });

    doc.save(`transacciones_globales_${new Date().getTime()}.pdf`);
  };

  return (
    <AdminLayout>
      <div className="account-history-page animate-fade-in-up" style={{ padding: '20px' }}>
        <div className="history-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="history-title">Historial global de transacciones</h2>
            <p className="history-sub">Visualiza los movimientos de todos los usuarios del sistema</p>
          </div>
          <button className="bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-red-700 transition" onClick={handleDownloadPDF}>
            <FaFilePdf /> Descargar PDF
        </button>
      </div>

      <div className="history-controls mt-6" style={{ background: '#fff', padding: '16px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <form className="search-bar" onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: '220px' }}>
          <FaSearch className="search-icon" style={{ marginLeft: '10px', color: '#999' }} />
          <input
            type="text"
            placeholder="Buscar por número de cuenta o nombre de usuario..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="search-input"
            style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: 'none', background: 'transparent' }}
          />
          <button type="submit" style={{ display: 'none' }}>Buscar</button>
        </form>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', minWidth: '320px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '180px' }}>
            <label className="filter-label">Tipo</label>
            <select
              className="filter-select"
              value={filters.type}
              onChange={(e) => { const v = e.target.value; const next = { ...filters, type: v }; setFilters(next); fetchTransactions(1, next); }}
            >
              <option value="">Todas</option>
              {TRANSACTION_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '180px' }}>
            <label className="filter-label">Estado</label>
            <select
              className="filter-select"
              value={filters.status}
              onChange={(e) => { const v = e.target.value; const next = { ...filters, status: v }; setFilters(next); fetchTransactions(1, next); }}
            >
              <option value="">Todos</option>
              {TRANSACTION_STATUS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <Card className="transactions-card mt-6">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando transacciones...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No se encontraron transacciones con los filtros actuales.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="transactions-table w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700 text-sm">
                  <th className="p-4 border-b">Fecha</th>
                  <th className="p-4 border-b">Cuenta</th>
                  <th className="p-4 border-b">Usuario</th>
                  <th className="p-4 border-b">Tipo</th>
                  <th className="p-4 border-b">Monto</th>
                  <th className="p-4 border-b">Estado</th>
                  <th className="p-4 border-b">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => {
                  const accInfo = t.accountInfo || {};
                  const owner = accInfo.owner || {};
                  return (
                    <tr key={t.id} className="border-b hover:bg-gray-50 text-sm">
                      <td className="p-4 text-gray-600">{formatDate(t.createdAt)}</td>
                      <td className="p-4 font-medium text-gray-800">{accInfo.accountNumber || 'N/A'}</td>
                      <td className="p-4 text-gray-600">{owner.name || owner.email || 'N/A'}</td>
                      <td className="p-4 text-gray-600">{t.type}</td>
                      <td className="p-4 font-bold text-gray-800">{formatCurrency(t.amount)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          t.status === 'COMPLETADA' ? 'bg-green-100 text-green-800' :
                          t.status === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <button 
                          onClick={() => setSelectedTransaction(t)}
                          className="text-blue-600 hover:underline font-medium text-sm">
                          Ver detalles
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {pagination.totalPages > 1 && (
          <div className="pagination flex justify-between items-center p-4 border-t border-gray-200">
            <span className="text-sm text-gray-600">
              Mostrando página {pagination.page} de {pagination.totalPages} ({pagination.totalRecords} registros)
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <FaChevronLeft /> Anterior
              </button>
              <button 
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Siguiente <FaChevronRight />
              </button>
            </div>
          </div>
        )}
      </Card>

      {selectedTransaction && (
        <TransactionDetailModal 
          transaction={selectedTransaction} 
          onClose={() => setSelectedTransaction(null)} 
        />
      )}
      </div>
    </AdminLayout>
  );
}
