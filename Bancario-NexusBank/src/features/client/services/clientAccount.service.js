import { axiosClient } from '../../../shared/api/api.js';

export const clientAccountService = {
  // Obtener datos de la cuenta principal del cliente
  getMainAccount: async () => {
    try {
      const response = await axiosClient.get('/accounts/main');
      return response.data?.data || null;
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
      const response = await axiosClient.get(`/transactions?limit=${limit}`);
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  },

  // Obtener perfil del usuario
  getUserProfile: async () => {
    try {
      const response = await axiosClient.get('/users/profile');
      return response.data?.data || null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  // Obtener datos del dashboard
  getDashboardData: async () => {
    try {
      const [account, profile, transactions] = await Promise.all([
        clientAccountService.getMainAccount(),
        clientAccountService.getUserProfile(),
        clientAccountService.getRecentTransactions(5),
      ]);

      return {
        account,
        profile,
        transactions,
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },
};
