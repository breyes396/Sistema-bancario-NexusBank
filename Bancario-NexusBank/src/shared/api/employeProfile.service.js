import axios from 'axios';
import { useAuthStore } from '../../features/auth/store/authStore.js';

const profileBaseURL = import.meta.env.VITE_BANKING_API_URL || import.meta.env.VITE_AUTH_URL || 'http://localhost:3007/api/v1';

const axiosProfile = axios.create({
	baseURL: profileBaseURL,
	timeout: 10000,
	headers: {
		'Content-Type': 'application/json',
	},
});

axiosProfile.interceptors.request.use((config) => {
	const token = useAuthStore.getState().token;
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

export const adminProfileService = {
	getOwnProfile: async () => {
		// Always fetch fresh profile data to ensure all fields are up to date
		const response = await axiosProfile.get('/auth/profile');
		return response.data || {};
	},

	updateOwnProfile: async (payload) => {
		const response = await axiosProfile.put('/profile/edit', payload);
		return response.data || {};
	},
};