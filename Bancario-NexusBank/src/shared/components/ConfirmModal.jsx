import React from 'react';

const toneStyles = {
  primary: 'bg-[#1A2E52] hover:bg-[#2D5899] text-white',
  danger: 'bg-[#B91C1C] hover:bg-[#DC2626] text-white',
};

const ConfirmModal = ({
  open,
  title,
  message,
  confirmLabel = 'Aceptar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  tone = 'primary',
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-[28px] border border-white/30 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
        <div className="bg-gradient-to-r from-[#1A2E52] to-[#2D5899] px-6 py-5 text-white">
          <p className="text-xs uppercase tracking-[0.28em] text-[#C8D9FF]">Confirmación</p>
          <h3 className="mt-2 text-2xl font-bold">{title}</h3>
        </div>
        <div className="space-y-3 px-6 py-5 text-sm text-gray-700">
          <p>{message}</p>
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-100 bg-[#F8FAFC] px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${toneStyles[tone] || toneStyles.primary}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;