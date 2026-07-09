import axios from 'axios';
import { axiosClient } from './api.js';
import { useAuthStore } from '../../features/auth/store/authStore.js';

const fallbackBaseURL = import.meta.env.VITE_BANKING_API_URL || import.meta.env.VITE_AUTH_URL || 'http://localhost:3007/api/v1';

const axiosClientFallback = axios.create({
  baseURL: fallbackBaseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const postTransferWithFallback = async (payload) => {
  try {
    return await axiosClient.post('/accounts/transfers', payload);
  } catch (error) {
    if (error.response?.status !== 404) {
      throw error;
    }

    return axiosClientFallback.post('/accounts/transfers', payload, {
      headers: getAuthHeaders(),
    });
  }
};

export const clientTransferService = {
  createTransfer: async (payload) => {
    try {
      const response = await postTransferWithFallback(payload);
      return response.data;
    } catch (error) {
      console.error('Error creating transfer:', error);
      throw error;
    }
  },
};