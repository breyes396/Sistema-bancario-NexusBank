import React, { useState, useEffect } from 'react';
import AdminNavbar from './AdminNavbar.jsx';
import AdminSidebar from './AdminSidebar.jsx';
import PromotionFormModal from './PromotionFormModal.jsx';
import { adminDashboardService } from '../../../api/adminDashboard.service.js';
import { showError, showSuccess } from '../../../utils/toast.js';
import { MdEdit, MdPause, MdClose, MdCheck, MdPlayArrow, MdAdd, MdArrowForward } from 'react-icons/md';
import '../../../../styles/promotions.css';

const PROMOTION_TYPES = [
  'PRIMER_DEPOSITO_BONUS',
  'TRANSFERENCIA_RECIBIDA_BONUS'
];

const PROMOTION_STATES = ['ACTIVA', 'INACTIVA', 'PAUSADA', 'EXPIRADA'];
const ITEMS_PER_PAGE = 5;

const formatPromotionType = (type) => {
  const typeMap = {
    'PRIMER_DEPOSITO_BONUS': 'Primer Depósito Bonus',
    'TRANSFERENCIA_RECIBIDA_BONUS': 'Transferencia Recibida Bonus'
  };
  return typeMap[type] || type;
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getBenefitLabel = (promotion) => {
  if (promotion.discountPercentage) return `${promotion.discountPercentage}% Desc.`;
  if (promotion.cashbackPercentage) return `${promotion.cashbackPercentage}% Cashback`;
  if (promotion.cashbackAmount) return `Q${promotion.cashbackAmount} Cashback`;
  if (promotion.bonusPoints) return `${promotion.bonusPoints} Puntos`;
  return '—';
};

const PromotionsManagementView = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' o 'edit'
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [pendingConfirm, setPendingConfirm] = useState(null);

  // Fetch de promociones
  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const response = await adminDashboardService.getAdminPromotions();
      const promoList = Array.isArray(response.data) ? response.data : (response.promotions || []);
      setPromotions(promoList);
    } catch (error) {
      console.error('Error fetching promotions:', error);
      const message = error.response?.data?.message || 'Error al cargar promociones';
      showError(message);
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  // Aplicar filtros
  const filteredPromotions = promotions.filter(promo => {
    const searchStr = `${promo.name} ${promo.description || ''} ${promo.promotionType}`.toLowerCase();
    const matchSearch = searchStr.includes(searchTerm.toLowerCase());
    
    const matchType = filterType ? promo.promotionType === filterType : true;
    const matchState = filterState ? promo.status === filterState : true;
    
    let matchDate = true;
    if (filterStartDate || filterEndDate) {
      const promoStart = promo.startDate ? new Date(promo.startDate).getTime() : 0;
      const promoEnd = promo.endDate ? new Date(promo.endDate).getTime() : Infinity;
      
      if (filterStartDate) {
        const filterStart = new Date(filterStartDate).getTime();
        matchDate = matchDate && promoEnd >= filterStart;
      }
      if (filterEndDate) {
        const filterEnd = new Date(filterEndDate).getTime();
        matchDate = matchDate && promoStart <= filterEnd;
      }
    }
    
    return matchSearch && matchType && matchState && matchDate;
  });

  const totalPages = Math.max(1, Math.ceil(filteredPromotions.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedPromotions = filteredPromotions.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, filterState, filterStartDate, filterEndDate]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('');
    setFilterState('');
    setFilterStartDate('');
    setFilterEndDate('');
    setCurrentPage(1);
  };

  // Abrir modal para crear
  const openCreateModal = () => {
    setModalMode('create');
    setSelectedPromotion(null);
    setIsModalOpen(true);
  };

  // Abrir modal para editar
  const openEditModal = (promotion) => {
    setModalMode('edit');
    setSelectedPromotion(promotion);
    setIsModalOpen(true);
  };

  // Cerrar modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPromotion(null);
  };

  // Callback cuando se crea/edita promoción
  const handlePromotionSaved = () => {
    closeModal();
    fetchPromotions();
    showSuccess(modalMode === 'create' ? 'Promoción creada exitosamente' : 'Promoción actualizada exitosamente');
  };

  // Cambiar estado de promoción
  const handleChangeStatus = (promotion, newStatus) => {
    const statusLabels = {
      'ACTIVA': 'Activar',
      'INACTIVA': 'Desactivar',
      'PAUSADA': 'Pausar',
      'EXPIRADA': 'Marcar como expirada'
    };
    setPendingConfirm({
      type: 'status',
      promotionId: promotion.id || promotion._id,
      promotionName: promotion.name,
      newStatus,
      actionLabel: `${statusLabels[newStatus]} la promoción`,
      confirmLabel: statusLabels[newStatus],
    });
  };

  const handleStatusToggle = async (promotion) => {
    const nextStatus = promotion.status === 'ACTIVA' ? 'PAUSADA' : 'ACTIVA';
    try {
      await adminDashboardService.updatePromotionStatus(promotion.id || promotion._id, nextStatus);
      showSuccess(`Promoción ${nextStatus === 'ACTIVA' ? 'activada' : 'pausada'} con éxito`);
      fetchPromotions();
    } catch (error) {
      showError(error.response?.data?.message || 'Error al actualizar estado');
    }
  };

  const handleDelete = (promotion) => {
    setPendingConfirm({
      type: 'delete',
      promotionId: promotion.id || promotion._id,
      promotionName: promotion.name,
      actionLabel: 'Eliminar la promoción',
      confirmLabel: 'Eliminar',
    });
  };

  const closeConfirm = () => setPendingConfirm(null);

  const handleConfirmAction = async () => {
    if (!pendingConfirm) return;

    try {
      if (pendingConfirm.type === 'status') {
        await adminDashboardService.updatePromotionStatus(pendingConfirm.promotionId, pendingConfirm.newStatus);
        showSuccess(`Promoción ${pendingConfirm.confirmLabel.toLowerCase()} exitosamente`);
      } else {
        await adminDashboardService.deletePromotion(pendingConfirm.promotionId);
        showSuccess('Promoción eliminada con éxito');
      }
      fetchPromotions();
      closeConfirm();
    } catch (error) {
      console.error('Error changing promotion action:', error);
      showError(error.response?.data?.message || error.message || 'Error al procesar la promoción');
    }
  };

  // Obtener botones de acción según estado
  const getActionButtons = (promotion) => {
    const buttons = [];
    const currentState = promotion.status;

    // Botón editar (siempre disponible)
    buttons.push(
      <button
        key={`edit-${promotion._id}`}
        onClick={() => openEditModal(promotion)}
        className="action-btn action-btn--edit"
        title="Editar promoción"
      >
        <MdEdit className="inline mr-1" /> Editar
      </button>
    );

    // Botones de estado según estado actual
    if (currentState === 'ACTIVA') {
      buttons.push(
        <button
          key={`pause-${promotion._id}`}
          onClick={() => handleChangeStatus(promotion, 'PAUSADA')}
          className="action-btn action-btn--warning"
          title="Pausar promoción"
        >
          <MdPause className="inline mr-1" /> Pausar
        </button>
      );
      buttons.push(
        <button
          key={`disable-${promotion._id}`}
          onClick={() => handleChangeStatus(promotion, 'INACTIVA')}
          className="action-btn action-btn--danger"
          title="Desactivar promoción"
        >
          <MdClose className="inline mr-1" /> Desactivar
        </button>
      );
    } else if (currentState === 'INACTIVA') {
      buttons.push(
        <button
          key={`activate-${promotion._id}`}
          onClick={() => handleChangeStatus(promotion, 'ACTIVA')}
          className="action-btn action-btn--success"
          title="Activar promoción"
        >
          <MdCheck className="inline mr-1" /> Activar
        </button>
      );
    } else if (currentState === 'PAUSADA') {
      buttons.push(
        <button
          key={`resume-${promotion._id}`}
          onClick={() => handleChangeStatus(promotion, 'ACTIVA')}
          className="action-btn action-btn--success"
          title="Reanudar promoción"
        >
          <MdPlayArrow className="inline mr-1" /> Reanudar
        </button>
      );
      buttons.push(
        <button
          key={`disable-${promotion._id}`}
          onClick={() => handleChangeStatus(promotion, 'INACTIVA')}
          className="action-btn action-btn--danger"
          title="Desactivar promoción"
        >
          <MdClose className="inline mr-1" /> Desactivar
        </button>
      );
    }
    // Para EXPIRADA: solo muestra editar

    return buttons;
  };

  return (
    <div className="admin-dashboard animate-fade-in-up">
      <AdminNavbar />
      <div className="admin-container">
        <AdminSidebar />
        <main className="admin-main">
          <section className="admin-section">
            {/* Header con título y botón crear */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-[#1A2E52]">Gestión de Promociones</h2>
              <button 
                onClick={openCreateModal}
                className="px-6 py-3 bg-gradient-to-r from-[#2D5899] to-[#1A2E52] text-white rounded-xl font-bold hover:shadow-lg transition transform hover:-translate-y-1 flex items-center gap-2"
              >
                <MdAdd className="text-xl" /> Crear Promoción
              </button>
            </div>

            {/* Sección de filtros */}
            <div className="promotions-filters glass-panel shadow-md rounded-2xl p-4 mb-6 border border-white/40">
              <div className="filters-header flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-[#1A2E52]">Filtros</h3>
                <button 
                  onClick={clearFilters}
                  className="px-4 py-2 bg-white border border-red-500 text-red-500 rounded-lg text-sm font-semibold hover:bg-red-50 transition"
                >
                  Limpiar Filtros
                </button>
              </div>
              
              <div className="filters-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Búsqueda por nombre */}
                <div className="filter-group">
                  <label className="block text-sm font-semibold text-[#1A2E52] mb-2">Buscar por nombre</label>
                  <input
                    type="text"
                    className="search-input w-full"
                    placeholder="Nombre de promoción..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Filtro por tipo */}
                <div className="filter-group">
                  <label className="block text-sm font-semibold text-[#1A2E52] mb-2">Tipo de Promoción</label>
                  <select
                    className="filter-select w-full"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="">Todos los tipos</option>
                    {PROMOTION_TYPES.map(type => (
                      <option key={type} value={type}>
                        {formatPromotionType(type)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por estado */}
                <div className="filter-group">
                  <label className="block text-sm font-semibold text-[#1A2E52] mb-2">Estado</label>
                  <select
                    className="filter-select w-full"
                    value={filterState}
                    onChange={(e) => setFilterState(e.target.value)}
                  >
                    <option value="">Todos los estados</option>
                    {PROMOTION_STATES.map(state => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro fecha inicio */}
                <div className="filter-group">
                  <label className="block text-sm font-semibold text-[#1A2E52] mb-2">Desde</label>
                  <input
                    type="date"
                    className="filter-select w-full"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                  />
                </div>

                {/* Filtro fecha fin */}
                <div className="filter-group">
                  <label className="block text-sm font-semibold text-[#1A2E52] mb-2">Hasta</label>
                  <input
                    type="date"
                    className="filter-select w-full"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Tabla de promociones */}
            <div className="movements-section glass-panel shadow-md rounded-2xl overflow-hidden border border-white/40">
              <div className="movements-header">
                <h3 className="movements-title">
                  Lista de Promociones ({filteredPromotions.length})
                </h3>
              </div>

              {loading ? (
                <div className="p-6 text-center text-gray-500">
                  Cargando promociones...
                </div>
              ) : filteredPromotions.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  {promotions.length === 0 
                    ? 'No hay promociones creadas aún.'
                    : 'No se encontraron promociones que coincidan con los filtros.'}
                </div>
              ) : (
                <div className="movements-table-wrapper">
                  <table className="movements-table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Tipo</th>
                        <th>Estado</th>
                        <th>Beneficio</th>
                        <th>Vigencia</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedPromotions.map((promo) => (
                        <tr key={promo._id} className="promotion-row">
                          <td className="font-semibold text-[#1A2E52]">{promo.name}</td>
                          <td>
                            <span className="type-badge">
                              {formatPromotionType(promo.promotionType)}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge status-badge-${promo.status.toLowerCase()}`}>
                              {promo.status}
                            </span>
                          </td>
                          <td>{getBenefitLabel(promo)}</td>
                          <td className="date-column text-sm">
                            {formatDate(promo.startDate)} <MdArrowForward className="inline mx-1 opacity-50" /> {formatDate(promo.endDate)}
                          </td>
                          <td>
                            <div className="actions-cell">
                              {getActionButtons(promo)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!loading && filteredPromotions.length > 0 && (
                <div className="pagination-container">
                  <div className="pagination-info">
                    Mostrando {startIndex + 1}-{Math.min(endIndex, filteredPromotions.length)} de {filteredPromotions.length}
                  </div>

                  <div className="pagination-controls">
                    <button
                      type="button"
                      className="pagination-btn"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    >
                      Anterior
                    </button>

                    <div className="pagination-pages">
                      {Array.from({ length: totalPages }, (_, index) => {
                        const page = index + 1;
                        return (
                          <button
                            key={page}
                            type="button"
                            className={`pagination-page-btn ${currentPage === page ? 'is-active' : ''}`}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      className="pagination-btn"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* Modal de crear/editar */}
      {isModalOpen && (
        <PromotionFormModal
          mode={modalMode}
          promotion={selectedPromotion}
          onClose={closeModal}
          onSave={handlePromotionSaved}
        />
      )}

      {pendingConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-[28px] border border-white/30 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
            <div className="bg-gradient-to-r from-[#1A2E52] to-[#2D5899] px-6 py-5 text-white">
              <p className="text-xs uppercase tracking-[0.28em] text-[#C8D9FF]">Confirmación</p>
              <h3 className="mt-2 text-2xl font-bold">{pendingConfirm.actionLabel}</h3>
            </div>
            <div className="space-y-3 px-6 py-5 text-sm text-gray-700">
              <p>Vas a <strong>{pendingConfirm.actionLabel.toLowerCase()}</strong> <strong>{pendingConfirm.promotionName}</strong>.</p>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 bg-[#F8FAFC] px-6 py-4">
              <button
                type="button"
                onClick={closeConfirm}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className="rounded-xl bg-[#1A2E52] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2D5899]"
              >
                {pendingConfirm.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionsManagementView;
