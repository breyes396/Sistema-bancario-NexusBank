import { useEffect } from 'react';
import { useClientStore } from '../store/useClientStore.js';
import { useAuthStore } from '../../auth/store/authStore.js';
import { showError } from '../../../shared/utils/toast.js';

export const ClientDashboard = () => {
  const user = useAuthStore((state) => state.user);
  const {
    mainAccount,
    accounts,
    transactions,
    userProfile,
    loading,
    error,
    fetchDashboardData,
    clearError,
  } = useClientStore();

  useEffect(() => {
    // Cargar datos del dashboard al montar el componente
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Mostrar error si existe
  useEffect(() => {
    if (error) {
      showError(error);
      clearError();
    }
  }, [error, clearError]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-12 h-12 border-4 border-[#2D5899] border-t-[#C8A84B] rounded-full"></div>
      </div>
    );
  }

  const displayAccounts = accounts.length > 0 ? accounts : (mainAccount ? [mainAccount] : []);
  const displayTransactions = transactions;

  const totalBalance = mainAccount?.balance || 0;
  const totalIncomes = mainAccount?.totalIncomes || 0;
  const totalExpenses = mainAccount?.totalExpenses || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-[#1A2E52]">
          Bienvenido, {user?.firstName || 'Usuario'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">Última actualización: Hoy</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Saldo Total Consolidado */}
        <div className="lg:col-span-1 bg-gradient-to-br from-[#2D5899] to-[#1A2E52] rounded-2xl p-6 text-white shadow-lg">
          <p className="text-[#E8D8A0] text-sm font-medium mb-2">Saldo total consolidado</p>
          <h2 className="text-4xl font-bold mb-4">
            Q {totalBalance.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
          </h2>
          <button className="text-[#C8A84B] hover:text-[#E8D8A0] transition font-medium text-sm">
            Actualizado hoy
          </button>
        </div>

        {/* Columna derecha: Ingresos y Gastos */}
        <div className="lg:col-span-2 space-y-4">
          {/* Ingresos del mes */}
          <div className="bg-white rounded-2xl p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Ingresos del mes</p>
                <h3 className="text-3xl font-bold text-[#2D5899] mt-2">
                  Q {totalIncomes.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="text-right">
                <p className="text-green-600 font-medium text-sm">+8.2%</p>
                <p className="text-gray-400 text-xs">vs anterior</p>
              </div>
            </div>
          </div>

          {/* Gastos del mes */}
          <div className="bg-white rounded-2xl p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Gastos del mes</p>
                <h3 className="text-3xl font-bold text-[#1A2E52] mt-2">
                  Q {totalExpenses.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="text-right">
                <p className="text-red-600 font-medium text-sm">-3.1%</p>
                <p className="text-gray-400 text-xs">vs anterior</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Mis Cuentas + Acciones Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mis Cuentas */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xl font-bold text-[#1A2E52]">Mis Cuentas</h3>
          {displayAccounts.length > 0 ? displayAccounts.map((account, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl p-4 shadow hover:shadow-md transition cursor-pointer"
            >
              <p className="text-gray-700 font-medium text-sm">{account.name || 'Cuenta Principal'}</p>
              <p className="text-gray-400 text-xs mt-1">{account.accountNumber || account.number || 'N/A'}</p>
              <p className="text-[#2D5899] font-bold text-lg mt-3">
                Q {(account.balance || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
              </p>
            </div>
          )) : (
             <p className="text-gray-500 text-sm py-4">No hay cuentas disponibles.</p>
          )}
        </div>

        {/* Acciones Rápidas */}
        <div className="lg:col-span-2">
          <h3 className="text-xl font-bold text-[#1A2E52] mb-4">Acciones Rápidas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Transferir', icon: '💸', path: '/client/transfers' },
              { label: 'Pagar', icon: '💳', path: '/client/payments' },
              { label: 'Reportes', icon: '📊', path: '/client/reports' },
              { label: 'Inversiones', icon: '📈', path: '/client/investments' },
            ].map((action, idx) => (
              <button
                key={idx}
                className="bg-white rounded-xl p-6 shadow hover:shadow-lg transition flex flex-col items-center justify-center space-y-2 group"
              >
                <span className="text-3xl group-hover:scale-110 transition">{action.icon}</span>
                <span className="text-gray-700 font-medium text-sm text-center">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Movimientos Recientes */}
      <div className="bg-white rounded-2xl p-6 shadow">
        <h3 className="text-xl font-bold text-[#1A2E52] mb-4">Movimientos Recientes</h3>
        <div className="space-y-3">
          {displayTransactions.length > 0 ? displayTransactions.map((tx, idx) => (
            <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div className="flex items-center space-x-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    tx.type === 'expense' || tx.amount < 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                  }`}
                >
                  {tx.type === 'expense' || tx.amount < 0 ? '↗' : '↙'}
                </div>
                <div>
                  <p className="text-gray-700 font-medium">{tx.description || tx.concept || 'Movimiento'}</p>
                  <p className="text-gray-400 text-xs">{tx.date || new Date(tx.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <p className={`font-bold ${tx.type === 'expense' || tx.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {tx.type === 'expense' || tx.amount < 0 ? '−' : '+'} Q {Math.abs(tx.amount || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
              </p>
            </div>
          )) : (
            <p className="text-gray-500 text-sm py-4">No hay movimientos recientes.</p>
          )}
        </div>
        <button className="w-full mt-4 py-2 text-[#2D5899] hover:bg-gray-50 rounded-lg transition font-medium">
          Ver todos los movimientos
        </button>
      </div>

      {/* Gráfico de Actividad */}
      <div className="bg-white rounded-2xl p-6 shadow">
        <h3 className="text-xl font-bold text-[#1A2E52] mb-4">Actividad Semanal</h3>
        <div className="flex items-end justify-center space-x-3 h-48">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, idx) => {
            const heights = [45, 60, 40, 75, 50, 30, 55];
            return (
              <div key={day} className="flex flex-col items-center">
                <div
                  className="w-8 bg-gradient-to-t from-[#2D5899] to-[#C8A84B] rounded-t transition hover:opacity-80"
                  style={{ height: `${heights[idx]}%` }}
                />
                <span className="text-gray-500 text-xs mt-2">{day}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
