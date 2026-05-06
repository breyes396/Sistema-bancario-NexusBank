import { Card, Typography } from '@material-tailwind/react';
import {
  FaArrowUp,
  FaArrowDown,
  FaExchangeAlt,
  FaClock,
} from 'react-icons/fa';

export const RecentTransactions = ({ transactions }) => {
  if (!transactions || transactions.length === 0) {
    return (
      <Card className="p-6">
        <Typography variant="h5" className="mb-4">
          Movimientos recientes
        </Typography>
        <div className="text-center py-8">
          <FaClock size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500">No hay movimientos disponibles</p>
        </div>
      </Card>
    );
  }

  const getTransactionIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'deposit':
      case 'ingreso':
        return <FaArrowDown className="text-green-600" size={16} />;
      case 'withdrawal':
      case 'retiro':
        return <FaArrowUp className="text-red-600" size={16} />;
      case 'transfer':
      case 'transferencia':
        return <FaExchangeAlt className="text-blue-600" size={16} />;
      default:
        return <FaClock className="text-gray-600" size={16} />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'deposit':
      case 'ingreso':
        return 'text-green-600';
      case 'withdrawal':
      case 'retiro':
        return 'text-red-600';
      case 'transfer':
      case 'transferencia':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getAmountSign = (type) => {
    const lowerType = type?.toLowerCase();
    if (lowerType === 'deposit' || lowerType === 'ingreso') return '+';
    if (lowerType === 'withdrawal' || lowerType === 'retiro') return '-';
    return '';
  };

  return (
    <Card className="p-6">
      <Typography variant="h5" className="mb-6">
        Movimientos recientes
      </Typography>

      <div className="space-y-4">
        {transactions.map((transaction, index) => (
          <div
            key={transaction.id || index}
            className="flex items-center justify-between rounded-lg hover:bg-gray-50 p-3 transition-colors border-b last:border-b-0"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
                {getTransactionIcon(transaction.type)}
              </div>

              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {transaction.description || transaction.type}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(transaction.date || transaction.createdAt).toLocaleDateString(
                    'es-GT',
                    { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                  )}
                </p>
              </div>
            </div>

            <div className={`text-right font-semibold ${getTransactionColor(transaction.type)}`}>
              <p>
                {getAmountSign(transaction.type)} {(transaction.amount || 0).toLocaleString('es-GT', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs text-gray-500">
                {transaction.status || 'Completado'}
              </p>
            </div>
          </div>
        ))}
      </div>

      <button className="mt-6 w-full rounded-lg border-2 border-[#2D5899] py-2 text-[#2D5899] font-medium hover:bg-[#2D5899] hover:text-white transition-colors">
        Ver todos los movimientos
      </button>
    </Card>
  );
};
