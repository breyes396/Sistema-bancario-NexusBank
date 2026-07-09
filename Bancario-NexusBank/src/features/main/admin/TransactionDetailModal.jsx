import React from 'react';
import { Card } from '@material-tailwind/react';

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '—';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'GTQ'
  }).format(parseFloat(amount));
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
};

export default function TransactionDetailModal({ transaction, onClose }) {
  if (!transaction) return null;

  const accInfo = transaction.accountInfo || {};
  const owner = accInfo.owner || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
      <Card className="w-full max-w-2xl bg-white p-6 rounded-lg shadow-xl relative overflow-y-auto max-h-[90vh]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-xl font-bold"
        >
          &times;
        </button>
        
        <h2 className="text-2xl font-bold text-[#102b55] mb-6 border-b pb-2">
          Detalles de Transacción
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Detalles de la transacción */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Información del Movimiento</h3>
            <div className="space-y-3 text-sm">
              <p><span className="font-medium text-gray-600">ID:</span> {transaction.id}</p>
              <p><span className="font-medium text-gray-600">Fecha:</span> {formatDate(transaction.createdAt)}</p>
              <p><span className="font-medium text-gray-600">Tipo:</span> {transaction.type}</p>
              <p><span className="font-medium text-gray-600">Estado:</span> 
                <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                  transaction.status === 'COMPLETADA' ? 'bg-green-100 text-green-800' :
                  transaction.status === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {transaction.status}
                </span>
              </p>
              <p><span className="font-medium text-gray-600">Monto:</span> <span className="font-bold text-lg text-[#102b55]">{formatCurrency(transaction.amount)}</span></p>
              {transaction.description && (
                <p><span className="font-medium text-gray-600">Descripción:</span> {transaction.description}</p>
              )}
            </div>
          </div>

          {/* Estadísticas del Usuario */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Estadística Individual y Cuenta</h3>
            <div className="space-y-3 text-sm p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p><span className="font-medium text-gray-600">Cuenta:</span> {accInfo.accountNumber || 'N/A'}</p>
              <p><span className="font-medium text-gray-600">Tipo de Cuenta:</span> {accInfo.accountType || 'N/A'}</p>
              <div className="my-2 border-b border-gray-200"></div>
              <p><span className="font-medium text-gray-600">Propietario:</span> {owner.name || 'N/A'}</p>
              <p><span className="font-medium text-gray-600">Email:</span> {owner.email || 'N/A'}</p>
              <p><span className="font-medium text-gray-600">Documento:</span> {owner.documentNumber || 'N/A'}</p>
              <p><span className="font-medium text-gray-600">Teléfono:</span> {owner.phoneNumber || 'N/A'}</p>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 italic">
                  * Esta información sirve como base para el análisis de actividad bancaria y el ranking de usuarios más activos.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded font-medium hover:bg-gray-300 transition"
          >
            Cerrar
          </button>
        </div>
      </Card>
    </div>
  );
}
