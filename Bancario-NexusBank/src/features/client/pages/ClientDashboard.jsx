import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../auth/store/authStore.js';
import { clientAccountService } from '../../../shared/api/clientAccount.service.js';
import { BalanceCard } from '../components/BalanceCard.jsx';
import { AccountsGrid } from '../components/AccountsGrid.jsx';
import { RecentTransactions } from '../components/RecentTransactions.jsx';
import { Card, Typography, Spinner } from '@material-tailwind/react';
import { showError } from '../../../shared/utils/toast.js';
import { FaChartBar, FaPiggyBank, FaMoneyBillWave } from 'react-icons/fa';

const getMonthRange = (date = new Date()) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
};

const isIncomeTransaction = (transaction) => {
  const type = String(transaction?.type || '').toUpperCase();
  return ['DEPOSITO', 'TRANSFERENCIA_RECIBIDA', 'INGRESO', 'ABONO'].includes(type);
};

const isExpenseTransaction = (transaction) => {
  const type = String(transaction?.type || '').toUpperCase();
  return ['RETIRO', 'TRANSFERENCIA_ENVIADA', 'COMPRA', 'EGRESO', 'GASTO'].includes(type);
};

const computeMonthlyTotals = (transactions = []) => {
  return transactions.reduce((totals, transaction) => {
    const amount = Number(transaction?.amount || 0);
    if (isIncomeTransaction(transaction)) {
      totals.income += amount;
    } else if (isExpenseTransaction(transaction)) {
      totals.expense += amount;
    }
    return totals;
  }, { income: 0, expense: 0 });
};

export const ClientDashboard = () => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [data, setData] = useState({
    account: null,
    profile: null,
    transactions: [],
    accounts: [],
  });
  const [monthlyTotals, setMonthlyTotals] = useState({ income: 0, expense: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await clientAccountService.getDashboardData();
      const accounts = Array.isArray(response.accounts) ? response.accounts : [];
      const mainAccount = response.account || accounts[0] || null;

      const normalizedAccount = mainAccount
        ? {
            ...mainAccount,
            balance: Number(mainAccount.accountBalance ?? mainAccount.balance ?? 0),
            currency: mainAccount.currency || 'Q',
            accountType: mainAccount.accountType || 'Cuenta',
          }
        : null;

      const accountId = normalizedAccount?.id || normalizedAccount?.accountId || null;
      let monthlyIncome = 0;
      let monthlyExpense = 0;

      if (accountId) {
        const { startDate, endDate } = getMonthRange();
        try {
          const monthHistory = await clientAccountService.getAccountHistory({
            accountId,
            startDate,
            endDate,
            limit: 500,
          });

          const monthTransactions = Array.isArray(monthHistory?.transactions) ? monthHistory.transactions : [];
          const computed = computeMonthlyTotals(monthTransactions);
          monthlyIncome = Number(monthHistory?.summary?.totalIncome || computed.income || 0);
          monthlyExpense = Number(monthHistory?.summary?.totalExpense || computed.expense || 0);
        } catch (historyError) {
          console.warn('No se pudo cargar el historial mensual para el dashboard', historyError);
          const computed = computeMonthlyTotals(Array.isArray(response.transactions) ? response.transactions : []);
          monthlyIncome = computed.income;
          monthlyExpense = computed.expense;
        }
      }

      setData({
        account: normalizedAccount,
        profile: response.profile?.user || response.profile || user || null,
        transactions: Array.isArray(response.transactions) ? response.transactions : [],
        accounts: accounts.map((account) => ({
          ...account,
          balance: Number(account.accountBalance ?? account.balance ?? 0),
          currency: account.currency || 'Q',
          accountType: account.accountType || 'Cuenta',
        })),
      });

      setMonthlyTotals({ income: monthlyIncome, expense: monthlyExpense });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spinner className="mx-auto mb-4" />
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Typography variant="h3" className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenido, {data.profile?.name || data.profile?.Name || user?.name || user?.username}
        </Typography>
        <Typography className="text-gray-600">
          Aquí puedes ver tu información financiera y realizar transacciones
        </Typography>
      </div>

      {/* Balance Card */}
      <BalanceCard account={data.account} />

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card className="p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Ingresos del mes</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                Q {monthlyTotals.income.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">Basado en movimientos reales</p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <FaMoneyBillWave size={24} className="text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Gastos del mes</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                Q {monthlyTotals.expense.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">Basado en movimientos reales</p>
            </div>
            <div className="rounded-full bg-red-100 p-3">
              <FaChartBar size={24} className="text-red-600" />
            </div>
          </div>
        </Card>

      </div>

      {/* Accounts Grid */}
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <Typography variant="h5">Mis Cuentas</Typography>
          <button
            type="button"
            onClick={() => navigate('/clientdashboard/accounts')}
            className="text-sm font-semibold text-[#2D5899] hover:text-[#1A2E52] transition-colors"
          >
            Ver todas las cuentas
          </button>
        </div>
        <AccountsGrid
          accounts={(data.accounts.length > 0 ? data.accounts : (data.account ? [data.account] : [])).slice(0, 3)}
        />
      </div>

      {/* Recent Transactions */}
      <RecentTransactions transactions={data.transactions} />
    </div>
  );
};
