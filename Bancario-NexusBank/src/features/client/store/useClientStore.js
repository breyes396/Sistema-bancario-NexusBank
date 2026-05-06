import { create } from 'zustand';
import { clientAccountService } from '../../../shared/api/clientAccount.service.js';

export const useClientStore = create((set) => ({
  // =====================
  // ESTADO INICIAL
  // =====================
  mainAccount: null,
  accounts: [],
  transactions: [],
  userProfile: null,
  loading: false,
  error: null,

  // =====================
  // ACCIONES - OBTENER CUENTA PRINCIPAL
  // =====================
  fetchMainAccount: async () => {
    try {
      set({ loading: true, error: null });
      const account = await clientAccountService.getMainAccount();
      set({ mainAccount: account, loading: false });
      return { success: true, data: account };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al obtener cuenta principal';
      set({ error: message, loading: false });
      return { success: false, error: message };
    }
  },

  // =====================
  // ACCIONES - OBTENER TODAS LAS CUENTAS
  // =====================
  fetchAllAccounts: async () => {
    try {
      set({ loading: true, error: null });
      const accounts = await clientAccountService.getAllAccounts();
      set({ accounts, loading: false });
      return { success: true, data: accounts };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al obtener cuentas';
      set({ error: message, loading: false });
      return { success: false, error: message };
    }
  },

  // =====================
  // ACCIONES - OBTENER MOVIMIENTOS RECIENTES
  // =====================
  fetchRecentTransactions: async (limit = 5) => {
    try {
      set({ loading: true, error: null });
      const transactions = await clientAccountService.getRecentTransactions(limit);
      set({ transactions, loading: false });
      return { success: true, data: transactions };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al obtener movimientos';
      set({ error: message, loading: false });
      return { success: false, error: message };
    }
  },

  // =====================
  // ACCIONES - OBTENER PERFIL DEL USUARIO
  // =====================
  fetchUserProfile: async () => {
    try {
      set({ loading: true, error: null });
      const profile = await clientAccountService.getUserProfile();
      set({ userProfile: profile, loading: false });
      return { success: true, data: profile };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al obtener perfil';
      set({ error: message, loading: false });
      return { success: false, error: message };
    }
  },

  // =====================
  // ACCIONES - OBTENER TODO (Dashboard)
  // =====================
  fetchDashboardData: async () => {
    try {
      set({ loading: true, error: null });
      const data = await clientAccountService.getDashboardData();

      set({
        mainAccount: data.account,
        userProfile: data.profile,
        transactions: data.transactions,
        accounts: data.accounts || [],
        loading: false,
      });

      return { success: true, data };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al cargar dashboard';
      set({ error: message, loading: false });
      return { success: false, error: message };
    }
  },

  // =====================
  // ACCIONES - LIMPIAR ESTADO
  // =====================
  clearError: () => set({ error: null }),
  resetStore: () =>
    set({
      mainAccount: null,
      accounts: [],
      transactions: [],
      userProfile: null,
      loading: false,
      error: null,
    }),
}));
