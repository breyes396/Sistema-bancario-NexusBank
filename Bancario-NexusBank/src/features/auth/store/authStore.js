import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { login as loginRequest } from '../../../shared/api/auth.js';
import { axiosClient } from '../../../shared/api/api.js';

export const useAuthStore = create(
  persist(
    (set) => ({
      lastProfileFetchedAt: null,
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

      updateUserProfile: (profileUpdates = {}) => {
        set((state) => {
          if (!state.user) return state;

          return {
            ...state,
            user: {
              ...state.user,
              ...profileUpdates,
            },
          };
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

      refreshUserProfile: async () => {
        try {
          const token = useAuthStore.getState().token;

          if (!token) {
            return { success: false, error: 'No autenticado' };
          }

          // Avoid refetching if we fetched recently (5s window)
          const now = Date.now();
          const last = useAuthStore.getState().lastProfileFetchedAt || 0;
          if (now - last < 5000) {
            const cachedUser = useAuthStore.getState().user || {};
            return {
              success: true,
              data: {
                Name: cachedUser.name,
                Username: cachedUser.username,
                ProfilePhotoUrl: cachedUser.profilePhotoUrl,
              },
            };
          }

          const response = await axiosClient.get('/auth/profile');
          const profile = response.data?.profile || {};

          set((state) => {
            if (!state.user) return { ...state, lastProfileFetchedAt: now };
            const nextName = profile.Name || state.user.name || state.user.username || 'Usuario';
            const nextUsername = profile.Username || state.user.username || state.user.name || 'Usuario';
            const nextProfilePhoto = profile.ProfilePhotoUrl || state.user.profilePhotoUrl || null;

            return {
              ...state,
              lastProfileFetchedAt: now,
              user: {
                ...state.user,
                name: nextName,
                username: nextUsername,
                profilePhotoUrl: nextProfilePhoto,
              },
            };
          });

          return { success: true, data: profile };
        } catch (error) {
          const message = error.response?.data?.msg || error.response?.data?.message || 'No se pudo actualizar el perfil';
          return { success: false, error: message };
        }
      },

      register: async (userData) => {
        try {
          set({ loading: true, error: null });

          const res = await registerRequest(userData);
          const payload = res.data || {};
          const payloadData = payload.data || {};

          return { success: true, data: payloadData };
        } catch (error) {
          const message = error.response?.data?.message || 'Error al registrar usuario';

          set({
            error: message,
            loading: false,
          });

          return { success: false, error: message };
        }
      },

      register: async (userData) => {
        try {
          set({ loading: true, error: null });

          const res = await registerRequest(userData);
          const payload = res.data || {};
          const payloadData = payload.data || {};

          return { success: true, data: payloadData };
        } catch (error) {
          const message = error.response?.data?.message || 'Error al registrar usuario';

          set({
            error: message,
            loading: false,
          });

          return { success: false, error: message };
        }
      },
    }),
    {
      name: 'nexusbank-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        expiresAt: state.expiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);