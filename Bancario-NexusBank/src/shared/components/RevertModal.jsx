import React, { useState, useEffect } from 'react';

export default function RevertModal({ open, onClose, onConfirm, title = 'Motivo de reversión', initialReason = '', createdAt, disableTimeCheck = false, requireReason = false, okLabel = 'Enviar' }) {
  const [reason, setReason] = useState(initialReason || '');
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    setReason(initialReason || '');
  }, [initialReason, open]);

  useEffect(() => {
    if (disableTimeCheck) return setDisabled(false);
    if (!createdAt) return setDisabled(false);
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    const elapsed = now - created;
    setDisabled(elapsed > 10 * 60 * 1000); // disabled if more than 10 minutes
  }, [createdAt, open, disableTimeCheck]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-bold text-[#1A2E52]">{title}</h3>
        </div>
        <div className="p-6">
          {disabled ? (
            <p className="text-sm text-red-600">El tiempo para solicitar la reversión ha expirado.</p>
          ) : (
            <textarea
              className="w-full h-28 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#163c78]"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe por qué quieres revertir esta operación"
            />
          )}
        </div>
        <div className="px-6 py-4 flex justify-end gap-3 border-t">
          <button className="px-4 py-2 rounded border" onClick={() => onClose()}>Cancelar</button>
          <button
            className={`px-4 py-2 rounded font-semibold ${disabled ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-[#163c78] text-white hover:bg-[#112a53]'}`}
            onClick={() => {
              if (disabled) return;
              if (requireReason && !reason.trim()) return;
              onConfirm(reason.trim());
            }}
            disabled={disabled || (requireReason && !reason.trim())}
          >{okLabel}</button>
        </div>
      </div>
    </div>
  );
}
