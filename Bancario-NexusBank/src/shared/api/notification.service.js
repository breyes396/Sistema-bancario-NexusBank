import { axiosAuth } from './api.js';
import { useAuthStore } from '../../features/auth/store/authStore.js';

export const notificationService = {
  getMyNotifications: async () => {
    try {
      const res = await axiosAuth.get('/notifications');
      return res.data;
    } catch (err) {
      console.error('notificationService.getMyNotifications error', err?.response?.data || err?.message || err);
      return { success: false, data: [] };
    }
  },

  markAsRead: async (id) => {
    try {
      const res = await axiosAuth.put(`/notifications/${id}/read`, {});
      return res.data;
    } catch (err) {
      console.error('notificationService.markAsRead error', err?.response?.data || err?.message || err);
      return { success: false };
    }
  }
};
