import axios from 'axios';
import { useAuthStore } from '../../features/auth/store/authStore.js';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3007/api/v1';

export const axiosClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});