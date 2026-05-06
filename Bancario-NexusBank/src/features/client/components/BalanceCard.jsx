import { Card } from '@material-tailwind/react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useState } from 'react';

export const BalanceCard = ({ account, isVisible = true }) => {
  const [showBalance, setShowBalance] = useState(isVisible);

  const balance = account?.balance || 0;
  const currency = account?.currency || 'Q';

  return (
    <Card className="bg-gradient-to-r from-[#2D5899] to-[#1A2E52] text-white p-6 shadow-lg">
      <div className="mb-4">
        <p className="text-sm font-medium opacity-90">Saldo total consolidado</p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold">
            {showBalance ? `${currency} ${balance.toLocaleString('es-GT', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}` : '• • • • • •'}
          </h2>
          <p className="mt-2 text-sm opacity-75">
            Actualizado hoy, {new Date().toLocaleDateString('es-GT')}
          </p>
        </div>

        <button
          onClick={() => setShowBalance(!showBalance)}
          className="rounded-full bg-white bg-opacity-20 p-3 hover:bg-opacity-30 transition-all"
        >
          {showBalance ? (
            <FaEye size={20} />
          ) : (
            <FaEyeSlash size={20} />
          )}
        </button>
      </div>
    </Card>
  );
};
