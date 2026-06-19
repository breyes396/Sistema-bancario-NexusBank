import axios from 'axios';
import { useAuthStore } from '../../features/auth/store/authStore.js';

const adminBaseURL = import.meta.env.VITE_BANKING_API_URL || import.meta.env.VITE_AUTH_URL || 'http://localhost:3007/api/v1';
const catalogBaseURL = import.meta.env.VITE_CATALOG_URL || 'http://localhost:3006/api/v1';

const axiosAdminBanking = axios.create({
  baseURL: adminBaseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const axiosAdminCatalog = axios.create({
  baseURL: catalogBaseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

axiosAdminBanking.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosAdminCatalog.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const adminRequest = async (method, url, dataOrConfig, maybeConfig) => {
  if (method === 'get') {
    return axiosAdminBanking.get(url, dataOrConfig);
  }
  if (method === 'post') {
    return axiosAdminBanking.post(url, dataOrConfig, maybeConfig);
  }
  if (method === 'put') {
    return axiosAdminBanking.put(url, dataOrConfig, maybeConfig);
  }
  throw new Error(`Unsupported method: ${method}`);
};

export const adminDashboardService = {
  getDashboardInfo: async () => {
    try {
      const response = await adminRequest('get', '/user/admin/dashboard-info');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard info:', error);
      throw error;
    }
  },

  getUsers: async (limit = 100) => {
    try {
      const response = await adminRequest('get', '/users', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  getTransactions: async (limit = 50) => {
    try {
      const response = await adminRequest('get', '/admin/transactions', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching admin transactions:', error);
      throw error;
    }
  },

  getGlobalTransactions: async (params = {}) => {
    try {
      const response = await adminRequest('get', '/admin/transactions', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching global transactions:', error);
      throw error;
    }
  },

  getTransactionRanking: async (params = {}) => {
    try {
      const response = await adminRequest('get', '/dashboard/transaction-ranking', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction ranking:', error);
      throw error;
    }
  },

  getAccounts: async () => {
    try {
      // Usamos el endpoint global de accounts, que para los administradores retorna todas las cuentas.
      const response = await adminRequest('get', '/accounts');
      return response.data;
    } catch (error) {
      console.error('Error fetching admin accounts:', error);
      throw error;
    }
  },

  getPendingAccountRequests: async () => {
    try {
      const response = await adminRequest('get', '/admin/account-requests');
      return response.data;
    } catch (error) {
      console.error('Error fetching pending account requests:', error);
      throw error;
    }
  },

  getAllAccountRequests: async () => {
    try {
      const response = await adminRequest('get', '/admin/account-requests/all');
      return response.data;
    } catch (error) {
      console.error('Error fetching all account requests:', error);
      throw error;
    }
  },

  approveAccountRequest: async (id) => {
    try {
      const response = await adminRequest('post', `/admin/account-requests/${id}/approve`);
      return response.data;
    } catch (error) {
      console.error('Error approving account request:', error);
      throw error;
    }
  },

  rejectAccountRequest: async (id) => {
    try {
      const response = await adminRequest('post', `/admin/account-requests/${id}/reject`);
      return response.data;
    } catch (error) {
      console.error('Error rejecting account request:', error);
      throw error;
    }
  },

  getDepositRequests: async () => {
    try {
      const response = await adminRequest('get', '/accounts/deposit-requests');
      return response.data;
    } catch (error) {
      console.error('Error fetching deposit requests:', error);
      throw error;
    }
  },

  approveDeposit: async (id) => {
    try {
      const response = await adminRequest('put', `/accounts/deposit-requests/${id}/approve`);
      return response.data;
    } catch (error) {
      console.error('Error approving deposit:', error);
      throw error;
    }
  },

  rejectDeposit: async (id) => {
    try {
      const response = await adminRequest('put', `/accounts/deposit-requests/${id}/revert`);
      return response.data;
    } catch (error) {
      console.error('Error rejecting deposit:', error);
      throw error;
    }
  },

  revertTransfer: async (id, payload = {}) => {
    try {
      const response = await adminRequest('put', `/accounts/transfers/${id}/revert`, payload);
      return response.data;
    } catch (error) {
      console.error('Error reverting transfer:', error);
      throw error;
    }
  },

  approveAccount: async (id) => {
    try {
      const response = await adminRequest('post', `/admin/accounts/${id}/enable`);
      return response.data;
    } catch (error) {
      console.error('Error approving account:', error);
      throw error;
    }
  },

  updateUser: async (id, data) => {
    try {
      const response = await adminRequest('put', `/users/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  rejectAccount: async (id) => {
    try {
      const response = await adminRequest('post', `/admin/accounts/${id}/reject`);
      return response.data;
    } catch (error) {
      console.error('Error rejecting account:', error);
      throw error;
    }
  },

  getAdminAccountDetails: async (accountId) => {
    try {
      const response = await adminRequest('get', `/admin/accounts/${accountId}/details`);
      return response.data;
    } catch (error) {
      console.error('Error fetching admin account details:', error);
      throw error;
    }
  },

  freezeAccount: async (accountId, payload) => {
    try {
      const response = await adminRequest('post', `/admin/accounts/${accountId}/freeze`, payload);
      return response.data;
    } catch (error) {
      console.error('Error freezing account:', error);
      throw error;
    }
  },

  unfreezeAccount: async (accountId, payload) => {
    try {
      const response = await adminRequest('post', `/admin/accounts/${accountId}/unfreeze`, payload);
      return response.data;
    } catch (error) {
      console.error('Error unfreezing account:', error);
      throw error;
    }
  },

  getEmployeesStats: async () => {
    try {
      const response = await adminRequest('get', '/users/employees/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching employees stats:', error);
      throw error;
    }
  },

  createDepositForAccount: async (payload) => {
    try {
      const response = await adminRequest('post', '/employee/deposits', payload);
      return response.data;
    } catch (error) {
      console.error('Error creating deposit:', error);
      throw error;
    }
  },

  getAdminPromotions: async () => {
    try {
      const response = await axiosAdminCatalog.get('/catalog/admin/all');
      return response.data;
    } catch (error) {
      console.error('Error fetching admin promotions:', error);
      throw error;
    }
  },

  createPromotion: async (payload) => {
    try {
      const response = await axiosAdminCatalog.post('/catalog/admin/create', payload);
      return response.data;
    } catch (error) {
      console.error('Error creating promotion:', error);
      throw error;
    }
  },

  updatePromotion: async (id, payload) => {
    try {
      const response = await axiosAdminCatalog.put(`/catalog/admin/${id}`, payload);
      return response.data;
    } catch (error) {
      console.error('Error updating promotion:', error);
      throw error;
    }
  },

  deletePromotion: async (id) => {
    try {
      const response = await axiosAdminCatalog.delete(`/catalog/admin/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting promotion:', error);
      throw error;
    }
  },

  updatePromotionStatus: async (id, status) => {
    try {
      const response = await axiosAdminCatalog.put(`/catalog/admin/${id}/status`, { newStatus: status });
      return response.data;
    } catch (error) {
      console.error('Error updating promotion status:', error);
      throw error;
    }
  }
};
