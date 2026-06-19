import { useState } from 'react';
import { clientAccountService } from '../../../shared/api/clientAccount.service.js';
import { useAuthStore } from '../../auth/store/authStore.js';
import { showSuccess, showError } from '../../../shared/utils/toast.js';

const NewAccountRequestModal = ({ visible, onClose, defaultUserId }) => {
  const [accountType, setAccountType] = useState('ahorro');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const tokenUser = useAuthStore((s) => s.user);

  if (!visible) return null;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        accountType: accountType,
        note: note,
      };
      await clientAccountService.createAccountRequest(payload);
      showSuccess('Solicitud enviada al administrador. Te notificaremos cuando sea aprobada.');
      onClose(true);
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || 'Error al enviar solicitud');
      onClose(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h3>Solicitud: Abrir nueva cuenta</h3>
        <p className="muted">Se enviará una notificación al administrador para su aprobación.</p>

        <div className="modal-row">
          <label>ID del solicitante</label>
          <div className="modal-val">{defaultUserId || tokenUser?.id || tokenUser?.userId || '—'}</div>
        </div>

        <div className="modal-row">
          <label>Tipo de cuenta</label>
          <select value={accountType} onChange={(e) => setAccountType(e.target.value)}>
            <option value="ahorro">Cuenta de Ahorros</option>
            <option value="corriente">Cuenta Corriente</option>
          </select>
        </div>

        <div className="modal-row">
          <label>Breve motivo</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Escribe una breve razón..." />
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={() => onClose(false)} disabled={loading}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>{loading ? 'Enviando...' : 'Enviar solicitud'}</button>
        </div>
      </div>
    </div>
  );
};

export default NewAccountRequestModal;
