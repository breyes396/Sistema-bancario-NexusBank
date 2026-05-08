import { axiosClient } from './api.js';
import { useAuthStore } from '../../features/auth/store/authStore.js';

export const adminProfileService = {
	getOwnProfile: async () => {
		// Always fetch fresh profile data to ensure all fields are up to date
		const response = await axiosClient.get('/auth/profile');
		return response.data || {};
	},

	updateOwnProfile: async (payload) => {
		const response = await axiosClient.put('/profile/edit', payload);
		return response.data || {};
	},
};