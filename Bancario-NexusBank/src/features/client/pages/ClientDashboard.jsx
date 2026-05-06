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
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (error) {
      showError(error);
      clearError();
    }
  }, [error, clearError]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-[#2D5899] opacity-20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-[#C8A84B] border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  const displayAccounts = accounts.length > 0 ? accounts : (mainAccount ? [mainAccount] : []);
  const displayTransactions = transactions;

  const totalBalance = mainAccount?.balance || 0;
  const totalIncomes = mainAccount?.totalIncomes || 0;
  const totalExpenses = mainAccount?.totalExpenses || 0;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-[#1A2E52] tracking-tight">
            Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2D5899] to-[#C8A84B]">{user?.firstName || 'Usuario'}</span>
          </h1>
          <p className="text-gray-500 font-medium mt-2">Aquí tienes el resumen de tus finanzas al día de hoy.</p>
        </div>
        <div className="glass-panel px-4 py-2 rounded-full inline-flex items-center self-start md:self-end">
          <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
          <span className="text-sm font-semibold text-gray-700">Conexión Segura</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Saldo Total Consolidado */}
        <div className="lg:col-span-1 bg-gradient-to-br from-[#1A2E52] via-[#2D5899] to-[#4B6697] rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden hover-lift">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-[#C8A84B] opacity-20 blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <p className="text-[#E8D8A0] font-medium tracking-wide uppercase text-sm">Saldo Disponible</p>
              <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg">
                <span className="text-xl">💳</span>
              </div>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-2">
              Q {totalBalance.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-white/70 text-sm font-medium">Cuenta Principal</p>
          </div>
        </div>

        {/* Ingresos y Gastos */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Ingresos */}
          <div className="glass-panel rounded-3xl p-6 lg:p-8 hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 font-semibold mb-1">Ingresos del mes</p>
                <h3 className="text-3xl font-bold text-[#2D5899]">
                  + Q {totalIncomes.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 shadow-inner">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
              </div>
            </div>
            <div className="mt-6 w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '70%' }}></div>
            </div>
          </div>

          {/* Gastos */}
          <div className="glass-panel rounded-3xl p-6 lg:p-8 hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 font-semibold mb-1">Gastos del mes</p>
                <h3 className="text-3xl font-bold text-[#1A2E52]">
                  - Q {totalExpenses.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 shadow-inner">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path></svg>
              </div>
            </div>
            <div className="mt-6 w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-red-500 h-1.5 rounded-full" style={{ width: '45%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones y Movimientos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Acciones Rápidas */}
        <div className="lg:col-span-2">
          <h3 className="text-2xl font-bold text-[#1A2E52] mb-6">¿Qué deseas hacer hoy?</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6">
            {[
              { label: 'Transferir', icon: '💸', color: 'from-blue-400 to-blue-600' },
              { label: 'Pagar Servicio', icon: '🧾', color: 'from-indigo-400 to-indigo-600' },
              { label: 'Invertir', icon: '📈', color: 'from-teal-400 to-teal-600' },
              { label: 'Tarjetas', icon: '💳', color: 'from-purple-400 to-purple-600' },
            ].map((action, idx) => (
              <button
                key={idx}
                className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center space-y-3 group hover-lift relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                <span className="text-4xl transform group-hover:scale-110 transition-transform duration-300">{action.icon}</span>
                <span className="font-semibold text-[#1A2E52]">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cuentas Secundarias */}
        <div className="lg:col-span-1">
          <h3 className="text-2xl font-bold text-[#1A2E52] mb-6">Mis Productos</h3>
          <div className="space-y-4">
            {displayAccounts.map((account, idx) => (
              <div
                key={idx}
                className="glass-panel rounded-2xl p-5 hover-lift cursor-pointer border-l-4 border-l-[#C8A84B]"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-[#1A2E52]">{account.name || 'Cuenta de Ahorro'}</p>
                    <p className="text-gray-500 text-sm font-mono mt-1">{account.accountNumber || '**** **** 1234'}</p>
                  </div>
                  <p className="text-[#2D5899] font-bold text-xl">
                    Q {(account.balance || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
            {displayAccounts.length === 0 && (
              <p className="text-gray-500 text-center py-4 glass-panel rounded-2xl">No hay cuentas disponibles.</p>
            )}
          </div>
        </div>
      </div>

      {/* Movimientos Recientes */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-[#1A2E52]">Movimientos Recientes</h3>
          <button className="text-[#2D5899] hover:text-[#1A2E52] font-semibold transition-colors flex items-center">
            Ver historial completo <span className="ml-1">→</span>
          </button>
        </div>
        <div className="glass-panel rounded-3xl p-2 lg:p-4 overflow-hidden">
          {displayTransactions.length > 0 ? (
            <div className="divide-y divide-gray-200/50">
              {displayTransactions.map((tx, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 hover:bg-white/40 transition-colors rounded-xl">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-sm ${
                        tx.type === 'expense' || tx.amount < 0 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'
                      }`}
                    >
                      {tx.type === 'expense' || tx.amount < 0 ? '🛍️' : '💰'}
                    </div>
                    <div>
                      <p className="font-bold text-[#1A2E52]">{tx.description || tx.concept || 'Transacción'}</p>
                      <p className="text-gray-500 text-sm mt-0.5">{tx.date || new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${tx.type === 'expense' || tx.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {tx.type === 'expense' || tx.amount < 0 ? '−' : '+'} Q {Math.abs(tx.amount || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">Completado</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <span className="text-4xl">📭</span>
              <p className="text-gray-500 font-medium mt-3">No hay movimientos recientes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
