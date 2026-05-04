import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { login as loginRequest } from '../../../shared/api/auth.js';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      expiresAt: null,
      loading: false,
      error: null,
      isAuthenticated: false,

      logout: () => {
        set({
          user: null,
          token: null,
          expiresAt: null,
          error: null,
          loading: false,
          isAuthenticated: false,
        });
      },

      login: async ({ emailOrUsername, password }) => {
        try {
          set({ loading: true, error: null });

          const res = await loginRequest({ emailOrUsername, password });
          const { data } = res;

          set({
            user: data.userDetails,
            token: data.token,
            expiresAt: data.expiresAt,
            loading: false,
            isAuthenticated: true,
          });

          return { success: true, data };
        } catch (error) {
          const message = error.response?.data?.message || 'Error de autenticación';

          set({
            error: message,
            loading: false,
            isAuthenticated: false,
          });

          return { success: false, error: message };
        }
      },
    }),
    {
      name: 'gastroflow-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        expiresAt: state.expiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);