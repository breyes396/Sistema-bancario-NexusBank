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
          // axios response: res.data is the payload from the server
          const payload = res.data || {};
          const payloadData = payload.data || {};

          set({
            user: payloadData.user || null,
            token: payloadData.token || null,
            expiresAt: payloadData.expiresAt || null,
            loading: false,
            isAuthenticated: !!payloadData.token,
          });

          // For compatibility with components expecting `userDetails`
          return { success: true, data: { userDetails: payloadData.user, token: payloadData.token } };
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