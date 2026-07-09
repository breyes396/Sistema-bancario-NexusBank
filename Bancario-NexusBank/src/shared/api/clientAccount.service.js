import axios from 'axios';
import { useAuthStore } from '../../features/auth/store/authStore.js';

const fallbackBaseURL = import.meta.env.VITE_BANKING_API_URL || import.meta.env.VITE_AUTH_URL || 'http://localhost:3007/api/v1';

const axiosClientFallback = axios.create({
  baseURL: fallbackBaseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getFromBankingApi = (url, options = {}) => {
  return axiosClientFallback.get(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...getAuthHeaders(),
    },
  });
};

const getAccountSortTimestamp = (account) => {
  const value = account?.openedAt || account?.createdAt || account?.updatedAt || 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const sortAccountsForDisplay = (accounts = []) => {
  return [...accounts].sort((left, right) => {
    const leftStatus = String(left?.accountStatus || '').toUpperCase();
    const rightStatus = String(right?.accountStatus || '').toUpperCase();

    if (leftStatus === 'ACTIVE' && rightStatus !== 'ACTIVE') return -1;
    if (rightStatus === 'ACTIVE' && leftStatus !== 'ACTIVE') return 1;

    const leftTime = getAccountSortTimestamp(left);
    const rightTime = getAccountSortTimestamp(right);

    if (leftTime !== rightTime) return leftTime - rightTime;

    return String(left?.accountNumber || '').localeCompare(String(right?.accountNumber || ''));
  });
};

export const clientAccountService = {
  // Obtener datos de la cuenta principal del cliente
  getMainAccount: async () => {
    try {
      const response = await getFromBankingApi('/accounts');
      const accounts = sortAccountsForDisplay(response.data?.data || []);
      return accounts.length > 0 ? accounts[0] : null;
    } catch (error) {
      console.error('Error fetching main account:', error);
      throw error;
    }
  },

  // Obtener todas las cuentas del cliente
  getAllAccounts: async () => {
    try {
      const response = await getFromBankingApi('/accounts');
      return sortAccountsForDisplay(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  },

  // Obtener últimos movimientos
  getRecentTransactions: async (limit = 5) => {
    try {
      const response = await getFromBankingApi(`/client/transactions?limit=${limit}`);
      return response.data?.data?.transactions || [];
    } catch (error) {
      if (error.response?.status === 404) {
        return [];
      }
      console.error('Error fetching transactions:', error);
      throw error;
    }
  },

  // Obtener perfil del usuario
  getUserProfile: async () => {
    try {
      const response = await getFromBankingApi('/auth/profile');
      return response.data || null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  // Actualizar perfil del usuario
  updateUserProfile: async (payload) => {
    try {
      const response = await axiosClientFallback.put('/profile/edit', payload, {
        headers: {
          ...getAuthHeaders(),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  // Obtener datos del dashboard
  getDashboardData: async () => {
    try {
      const [account, profile, transactionsRaw, accounts] = await Promise.all([
        clientAccountService.getMainAccount(),
        clientAccountService.getUserProfile(),
        clientAccountService.getRecentTransactions(5),
        clientAccountService.getAllAccounts(),
      ]);

      // Normalizar transactions: algunos endpoints devuelven un objeto { transactions, pagination, summary }
      let transactions = [];
      if (Array.isArray(transactionsRaw)) transactions = transactionsRaw;
      else if (transactionsRaw && Array.isArray(transactionsRaw.transactions)) transactions = transactionsRaw.transactions;

      if (!Array.isArray(transactions) || transactions.length === 0) {
        console.warn('[clientAccountService] dashboard: no transactions returned from API', { transactionsRaw });
      }

      return {
        account,
        profile,
        transactions,
        accounts,
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },
  // Enviar solicitud para abrir nueva cuenta (servidor debe manejarla)
  createAccountRequest: async (payload) => {
    try {
      const response = await axiosClientFallback.post('/accounts/requests', payload, {
        headers: {
          ...getAuthHeaders(),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating account request:', error);
      throw error;
    }
  },

  // Obtener historial completo de movimientos con filtros y paginación
  getAccountHistory: async (filters = {}) => {
    try {
      const {
        page = 1,
        limit = 10,
        accountId = null,
        type = null,
        status = null,
        startDate = null,
        endDate = null
      } = filters;

      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);

      if (accountId) params.append('accountId', accountId);
      if (type) params.append('type', type);
      if (status) params.append('status', status);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await getFromBankingApi(`/my-account/history?${params.toString()}`);
      return response.data?.data || { transactions: [], pagination: {}, summary: {} };
    } catch (error) {
      console.error('Error fetching account history:', error);
      throw error;
    }
  },

  // Obtener detalles de un movimiento específico
  getTransactionDetail: async (transactionId) => {
    try {
      const response = await getFromBankingApi(`/accounts/transfers/${transactionId}`);
      return response.data?.data || null;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error fetching transaction detail:', error);
      throw error;
    }
  }
,

  // Obtener tasa de cambio desde el backend (usa /my-account/balance/convert)
  getExchangeRate: async (targetCurrency, accountId) => {
    try {
      const params = new URLSearchParams();
      if (accountId) params.append('accountId', accountId);
      if (targetCurrency) params.append('targetCurrency', targetCurrency);
      const response = await getFromBankingApi(`/my-account/balance/convert?${params.toString()}`);
      return response.data?.data?.exchangeRate ?? null;
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      return null;
    }
  }
};
