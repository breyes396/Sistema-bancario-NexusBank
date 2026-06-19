import React, { useEffect, useState } from 'react';
import { adminDashboardService } from '../../../shared/api/adminDashboard.service.js';
import { Card } from '@material-tailwind/react';
import { FaTrophy, FaChartLine } from 'react-icons/fa';
import AdminLayout from '../../../shared/components/layout/admin/AdminLayout.jsx';

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '—';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'GTQ'
  }).format(parseFloat(amount));
};

export default function RankingView() {
  const [rankingMoney, setRankingMoney] = useState([]);
  const [rankingMovements, setRankingMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        setLoading(true);
        // Top 10 by Balance
        const resMoney = await adminDashboardService.getTransactionRanking({ orderBy: 'BALANCE', limit: 10 });
        if (resMoney.success) {
          setRankingMoney(resMoney.data.ranking);
        }

        // Top 10 by Movements
        const resMovements = await adminDashboardService.getTransactionRanking({ orderBy: 'MOVEMENTS', limit: 10 });
        if (resMovements.success) {
          setRankingMovements(resMovements.data.ranking);
        }
      } catch (err) {
        setError('Error al cargar los rankings de usuarios');
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, []);

  return (
    <AdminLayout>
      <div className="ranking-page animate-fade-in-up" style={{ padding: '20px' }}>
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-[#102b55] flex items-center gap-2">
            <FaTrophy className="text-yellow-500" /> Ranking de Usuarios
          </h2>
        <p className="text-gray-600">Visualiza los usuarios con mayor actividad bancaria y fondos</p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500 text-lg">Cargando rankings...</div>
      ) : error ? (
        <div className="p-8 text-center text-red-500 text-lg">{error}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Top 10 - Más Dinero */}
          <Card className="p-6 shadow-md border-t-4 border-green-500">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaChartLine className="text-green-500" /> Top 10 Usuarios con Más Dinero
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 text-sm">
                    <th className="p-3 border-b">#</th>
                    <th className="p-3 border-b">Usuario</th>
                    <th className="p-3 border-b">Cuenta</th>
                    <th className="p-3 border-b text-right">Balance Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rankingMoney.map((acc, index) => (
                    <tr key={acc.accountId} className="border-b hover:bg-gray-50 text-sm transition">
                      <td className="p-3 font-bold text-gray-500">{index + 1}</td>
                      <td className="p-3 text-gray-800">{acc.ownerEmail}</td>
                      <td className="p-3 text-gray-600">{acc.accountNumber}</td>
                      <td className="p-3 text-right font-bold text-green-700">
                        {formatCurrency(acc.accountbalance)}
                      </td>
                    </tr>
                  ))}
                  {rankingMoney.length === 0 && (
                    <tr><td colSpan="4" className="p-4 text-center text-gray-500">No hay datos disponibles</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Top 10 - Más Movimientos */}
          <Card className="p-6 shadow-md border-t-4 border-blue-500">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaChartLine className="text-blue-500" /> Cuentas con Más Movimientos
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 text-sm">
                    <th className="p-3 border-b">#</th>
                    <th className="p-3 border-b">Usuario</th>
                    <th className="p-3 border-b">Cuenta</th>
                    <th className="p-3 border-b text-right">Total Transacciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rankingMovements.map((acc, index) => (
                    <tr key={acc.accountId} className="border-b hover:bg-gray-50 text-sm transition">
                      <td className="p-3 font-bold text-gray-500">{index + 1}</td>
                      <td className="p-3 text-gray-800">{acc.ownerEmail}</td>
                      <td className="p-3 text-gray-600">{acc.accountNumber}</td>
                      <td className="p-3 text-right font-bold text-[#102b55]">
                        {acc.totalMovements} movs
                      </td>
                    </tr>
                  ))}
                  {rankingMovements.length === 0 && (
                    <tr><td colSpan="4" className="p-4 text-center text-gray-500">No hay datos disponibles</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

        </div>
        )}
      </div>
    </AdminLayout>
  );
}
