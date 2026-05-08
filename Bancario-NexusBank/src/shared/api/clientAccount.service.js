import { axiosClient } from './api.js';
import { useAuthStore } from '../../features/auth/store/authStore.js';

export const clientAccountService = {
  // Obtener datos de la cuenta principal del cliente
  getMainAccount: async () => {
    try {
      const response = await axiosClient.get('/accounts');
      const accounts = response.data?.data || [];
      return accounts.length > 0 ? accounts[0] : null;
    } catch (error) {
      console.error('Error fetching main account:', error);
      throw error;
    }
  },

  // Obtener todas las cuentas del cliente
  getAllAccounts: async () => {
    try {
      const response = await axiosClient.get('/accounts');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }
  },

  // Obtener últimos movimientos
  getRecentTransactions: async (limit = 5) => {
    try {
      const response = await axiosClient.get(`/client/transactions?limit=${limit}`);
      return response.data?.data?.transactions || [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  },

  // Obtener perfil del usuario
  getUserProfile: async () => {
    try {
      // If we already have the user in the auth store, return a lightweight profile
      const cached = useAuthStore.getState().user;
      if (cached) {
        return {
          Name: cached.name || cached.fullName || null,
          Username: cached.username || cached.name || null,
          ProfilePhotoUrl: cached.profilePhotoUrl || null,
        };
      }

      const response = await axiosClient.get('/auth/profile');
      return response.data?.profile || response.data || null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  // Obtener datos del dashboard
  getDashboardData: async () => {
    try {
      const [account, profile, transactions, accounts] = await Promise.all([
        clientAccountService.getMainAccount(),
        clientAccountService.getUserProfile(),
        clientAccountService.getRecentTransactions(5),
        clientAccountService.getAllAccounts(),
      ]);

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
};
