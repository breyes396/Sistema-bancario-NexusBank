import { axiosAdmin } from './api.js';

export const adminDashboardService = {
  getUsers: async (limit = 100) => {
    try {
      const response = await axiosAdmin.get('/users', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  getTransactions: async (limit = 50) => {
    try {
      const response = await axiosAdmin.get('/admin/transactions', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching admin transactions:', error);
      throw error;
    }
  },

  getAccounts: async () => {
    try {
      // Usamos el endpoint global de accounts, que para los administradores retorna todas las cuentas.
      const response = await axiosAdmin.get('/accounts');
      return response.data;
    } catch (error) {
      console.error('Error fetching admin accounts:', error);
      throw error;
    }
  }
};
