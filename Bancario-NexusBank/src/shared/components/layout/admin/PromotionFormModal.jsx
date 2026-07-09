import React, { useState, useEffect } from 'react';
import { adminDashboardService } from '../../../api/adminDashboard.service.js';
import { showError, showSuccess } from '../../../utils/toast.js';
import { MdAdd, MdEdit, MdClose, MdWarning, MdArrowDropDown, MdArrowRight, MdHourglassEmpty, MdCheck } from 'react-icons/md';

const PROMOTION_TYPES = [
  'PRIMER_DEPOSITO_BONUS',
  'TRANSFERENCIA_RECIBIDA_BONUS'
];

const NUMERIC_FIELDS = new Set([
  'minDepositAmount',
  'maxDepositAmount',
  'minTransferAmount',
  'maxTransferAmount',
  'minConsecutiveTransactions',
  'minAccountBalance',
  'discountPercentage',
  'cashbackPercentage',
  'cashbackAmount',
  'bonusPoints',
  'maxUsesPerClient',
  'maxUsesTotalPromotion'
]);

const EDITABLE_FIELDS = new Set([
  'name',
  'description',
  'minDepositAmount',
  'maxDepositAmount',
  'minTransferAmount',
  'maxTransferAmount',
  'minConsecutiveTransactions',
  'minAccountBalance',
  'discountPercentage',
  'cashbackPercentage',
  'cashbackAmount',
  'bonusPoints',
  'maxUsesPerClient',
  'maxUsesTotalPromotion',
  'startDate',
  'endDate',
  'isExclusive',
  'notes',
  'reason'
]);

const formatPromotionType = (type) => {
  const typeMap = {
    'PRIMER_DEPOSITO_BONUS': 'Primer Depósito Bonus',
    'TRANSFERENCIA_RECIBIDA_BONUS': 'Transferencia Recibida Bonus'
  };
  return typeMap[type] || type;
};

const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

const PromotionFormModal = ({ mode = 'create', promotion = null, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    promotionType: '',
    description: '',
    startDate: '',
    endDate: '',
    discountPercentage: '',
    cashbackPercentage: '',
    cashbackAmount: '',
    bonusPoints: '',
    minDepositAmount: '',
    maxDepositAmount: '',
    minTransferAmount: '',
    maxTransferAmount: '',
    minConsecutiveTransactions: '',
    minAccountBalance: '',
    maxUsesPerClient: '',
    maxUsesTotalPromotion: '',
    isExclusive: false,
    notes: '',
    reason: '' // Para auditoría en edición
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [expandedAdvanced, setExpandedAdvanced] = useState(false);

  // Inicializar formulario en modo edición
  useEffect(() => {
    if (mode === 'edit' && promotion) {
      setFormData({
        name: promotion.name || '',
        promotionType: promotion.promotionType || '',
        description: promotion.description || '',
        startDate: formatDateForInput(promotion.startDate),
        endDate: formatDateForInput(promotion.endDate),
        discountPercentage: promotion.discountPercentage || '',
        cashbackPercentage: promotion.cashbackPercentage || '',
        cashbackAmount: promotion.cashbackAmount || '',
        bonusPoints: promotion.bonusPoints || '',
        minDepositAmount: promotion.minDepositAmount || '',
        maxDepositAmount: promotion.maxDepositAmount || '',
        minTransferAmount: promotion.minTransferAmount || '',
        maxTransferAmount: promotion.maxTransferAmount || '',
        minConsecutiveTransactions: promotion.minConsecutiveTransactions || '',
        minAccountBalance: promotion.minAccountBalance || '',
        maxUsesPerClient: promotion.maxUsesPerClient || '',
        maxUsesTotalPromotion: promotion.maxUsesTotalPromotion || '',
        isExclusive: promotion.isExclusive || false,
        notes: promotion.notes || '',
        reason: ''
      });
    }
  }, [mode, promotion]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Limpiar error del campo cuando se edita
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validaciones requeridas
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.promotionType) newErrors.promotionType = 'Selecciona un tipo de promoción';
    if (!formData.startDate) newErrors.startDate = 'La fecha de inicio es requerida';
    if (!formData.endDate) newErrors.endDate = 'La fecha de fin es requerida';

    // Validaciones de fecha
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (endDate <= startDate) {
        newErrors.endDate = 'La fecha de fin debe ser posterior a la de inicio';
      }
    }

    // Beneficio único: cashback en dinero
    if (!formData.cashbackAmount && formData.cashbackAmount !== 0) {
      newErrors.benefits = 'Debes especificar el cashback en dinero';
    }
    if (formData.cashbackAmount && (isNaN(formData.cashbackAmount) || formData.cashbackAmount < 0)) {
      newErrors.cashbackAmount = 'Debe ser un número no negativo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showError('Por favor corrige los errores en el formulario');
      return;
    }

    setLoading(true);
    try {
      // Limpiar campos vacíos antes de enviar
      const payload = {};
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '' && formData[key] !== null) {
          if (mode === 'edit' && key === 'promotionType') return; // Cannot edit promotionType
          payload[key] = NUMERIC_FIELDS.has(key) ? Number(formData[key]) : formData[key];
        }
      });

      if (mode === 'create') {
        await adminDashboardService.createPromotion(payload);
        showSuccess('Promoción creada con éxito');
      } else {
        await adminDashboardService.updatePromotion(promotion.id || promotion._id, payload);
        showSuccess('Promoción actualizada con éxito');
      }

      onSave(); // Refresca la lista
      onClose(); // Cierra el modal
    } catch (error) {
      console.error('Error saving promotion:', error);
      const message = error.response?.data?.message || 'Error al guardar la promoción';
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(6,14,28,0.82)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(160deg, #0a1c3a 0%, #0f2a54 100%)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 24,
          padding: '32px 36px',
          width: '100%',
          maxWidth: 700,
          boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
          animation: 'modalIn 0.25s cubic-bezier(.34,1.56,.64,1)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes modalIn {
            from { opacity:0; transform: scale(0.92) translateY(16px); }
            to   { opacity:1; transform: scale(1)   translateY(0); }
          }
        `}</style>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>
            {mode === 'create' ? <><MdAdd className="inline mr-2" /> Crear Promoción</> : <><MdEdit className="inline mr-2" /> Editar Promoción</>}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 10, padding: '8px 12px', color: '#fff', cursor: 'pointer', fontSize: 18 }}
          >
            <MdClose />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          {/* Campos Principales */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ color: '#C8A84B', fontSize: 14, fontWeight: 700, marginBottom: 16, textTransform: 'uppercase' }}>
              Información Principal
            </h3>

            {/* Nombre */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#cfe0ff', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Nombre de Promoción *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                maxLength={100}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${errors.name ? '#f87171' : 'rgba(255,255,255,0.2)'}`,
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontSize: 14,
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
                placeholder="Ej: Cashback Depósitos Mayo"
              />
              {errors.name && <div style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}><MdWarning className="inline mr-1" /> {errors.name}</div>}
            </div>

            {/* Tipo de Promoción */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#cfe0ff', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Tipo de Promoción *
              </label>
              <select
                name="promotionType"
                value={formData.promotionType}
                onChange={handleInputChange}
                className="custom-select-options"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${errors.promotionType ? '#f87171' : 'rgba(255,255,255,0.2)'}`,
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontSize: 14,
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
              >
                <option value="">Selecciona un tipo...</option>
                {PROMOTION_TYPES.map(type => (
                  <option key={type} value={type}>
                    {formatPromotionType(type)}
                  </option>
                ))}
              </select>
              {errors.promotionType && <div style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}><MdWarning className="inline mr-1" /> {errors.promotionType}</div>}
            </div>

            {/* Descripción */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#cfe0ff', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Descripción
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontSize: 14,
                  boxSizing: 'border-box',
                  minHeight: 80,
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
                placeholder="Describe los detalles de la promoción..."
              />
            </div>
          </div>

          {/* Fechas */}
          <div style={{ marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ color: '#cfe0ff', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Fecha de Inicio *
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${errors.startDate ? '#f87171' : 'rgba(255,255,255,0.2)'}`,
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
              />
              {errors.startDate && <div style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}><MdWarning className="inline mr-1" /> {errors.startDate}</div>}
            </div>
            <div>
              <label style={{ color: '#cfe0ff', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Fecha de Fin *
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${errors.endDate ? '#f87171' : 'rgba(255,255,255,0.2)'}`,
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
              />
              {errors.endDate && <div style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}><MdWarning className="inline mr-1" /> {errors.endDate}</div>}
            </div>
          </div>

          {/* Beneficios */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ color: '#C8A84B', fontSize: 14, fontWeight: 700, marginBottom: 16, textTransform: 'uppercase' }}>
              Beneficios (Cashback en dinero) *
            </h3>
            {errors.benefits && <div style={{ color: '#f87171', fontSize: 12, marginBottom: 12 }}><MdWarning className="inline mr-1" /> {errors.benefits}</div>}
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#cfe0ff', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Cashback (Monto en Q)
              </label>
              <input
                type="number"
                name="cashbackAmount"
                value={formData.cashbackAmount}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${errors.cashbackAmount ? '#f87171' : 'rgba(255,255,255,0.2)'}`,
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
                placeholder="0.00"
              />
              {errors.cashbackAmount && <div style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}><MdWarning className="inline mr-1" /> {errors.cashbackAmount}</div>}
            </div>
          </div>

          {/* Campos Avanzados (Acordeón) */}
          <div style={{ marginBottom: 24 }}>
            <button
              type="button"
              onClick={() => setExpandedAdvanced(!expandedAdvanced)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(200,168,75,0.12)',
                border: '1px solid rgba(200,168,75,0.3)',
                borderRadius: 8,
                color: '#C8A84B',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {expandedAdvanced ? <MdArrowDropDown size={20} /> : <MdArrowRight size={20} />} Campos Avanzados
              </span>
            </button>

            {expandedAdvanced && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                {/* Montos de Depósito */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ color: '#cfe0ff', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                      Monto Mínimo Depósito (Q)
                    </label>
                    <input
                      type="number"
                      name="minDepositAmount"
                      value={formData.minDepositAmount}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.08)',
                        color: '#fff',
                        fontSize: 14,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ color: '#cfe0ff', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                      Monto Máximo Depósito (Q)
                    </label>
                    <input
                      type="number"
                      name="maxDepositAmount"
                      value={formData.maxDepositAmount}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.08)',
                        color: '#fff',
                        fontSize: 14,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Montos de Transferencia */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ color: '#cfe0ff', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                      Monto Mínimo Transferencia (Q)
                    </label>
                    <input
                      type="number"
                      name="minTransferAmount"
                      value={formData.minTransferAmount}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.08)',
                        color: '#fff',
                        fontSize: 14,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ color: '#cfe0ff', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                      Monto Máximo Transferencia (Q)
                    </label>
                    <input
                      type="number"
                      name="maxTransferAmount"
                      value={formData.maxTransferAmount}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.08)',
                        color: '#fff',
                        fontSize: 14,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Otros límites */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ color: '#cfe0ff', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                      Transacciones Consecutivas Mín.
                    </label>
                    <input
                      type="number"
                      name="minConsecutiveTransactions"
                      value={formData.minConsecutiveTransactions}
                      onChange={handleInputChange}
                      min="0"
                      step="1"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.08)',
                        color: '#fff',
                        fontSize: 14,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ color: '#cfe0ff', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                      Saldo Mínimo en Cuenta (Q)
                    </label>
                    <input
                      type="number"
                      name="minAccountBalance"
                      value={formData.minAccountBalance}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.08)',
                        color: '#fff',
                        fontSize: 14,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Límites de uso */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ color: '#cfe0ff', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                      Usos Máx. por Cliente
                    </label>
                    <input
                      type="number"
                      name="maxUsesPerClient"
                      value={formData.maxUsesPerClient}
                      onChange={handleInputChange}
                      min="1"
                      step="1"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: `1px solid ${errors.maxUsesPerClient ? '#f87171' : 'rgba(255,255,255,0.2)'}`,
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.08)',
                        color: '#fff',
                        fontSize: 14,
                        boxSizing: 'border-box'
                      }}
                    />
                    {errors.maxUsesPerClient && <div style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>⚠️ {errors.maxUsesPerClient}</div>}
                  </div>
                  <div>
                    <label style={{ color: '#cfe0ff', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                      Usos Máx. Totales
                    </label>
                    <input
                      type="number"
                      name="maxUsesTotalPromotion"
                      value={formData.maxUsesTotalPromotion}
                      onChange={handleInputChange}
                      min="1"
                      step="1"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: `1px solid ${errors.maxUsesTotalPromotion ? '#f87171' : 'rgba(255,255,255,0.2)'}`,
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.08)',
                        color: '#fff',
                        fontSize: 14,
                        boxSizing: 'border-box'
                      }}
                    />
                    {errors.maxUsesTotalPromotion && <div style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>⚠️ {errors.maxUsesTotalPromotion}</div>}
                  </div>
                </div>

                {/* Notas e Exclusividad */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ color: '#cfe0ff', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      name="isExclusive"
                      checked={formData.isExclusive}
                      onChange={handleInputChange}
                      style={{ width: 18, height: 18, cursor: 'pointer' }}
                    />
                    Promoción Exclusiva
                  </label>
                </div>

                <div>
                  <label style={{ color: '#cfe0ff', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Notas Internas
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.08)',
                      color: '#fff',
                      fontSize: 14,
                      boxSizing: 'border-box',
                      minHeight: 60,
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                    placeholder="Notas internas sobre esta promoción..."
                  />
                </div>

                {/* Razón de cambio (solo en edición) */}
                {mode === 'edit' && (
                  <div style={{ marginTop: 16 }}>
                    <label style={{ color: '#cfe0ff', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                      Razón de Cambio (para auditoría)
                    </label>
                    <textarea
                      name="reason"
                      value={formData.reason}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.08)',
                        color: '#fff',
                        fontSize: 14,
                        boxSizing: 'border-box',
                        minHeight: 60,
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                      placeholder="¿Por qué se realiza este cambio?"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8,
                color: '#cfe0ff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 24px',
                background: loading ? 'rgba(45, 88, 153, 0.5)' : 'linear-gradient(90deg, #2D5899, #1A2E52)',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.2s'
              }}
            >
              {loading ? '⏳ Guardando...' : mode === 'create' ? '✓ Crear Promoción' : '✓ Actualizar Promoción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromotionFormModal;
