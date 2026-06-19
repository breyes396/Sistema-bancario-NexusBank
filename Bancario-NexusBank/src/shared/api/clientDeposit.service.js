import { axiosClient } from './api.js';
import axios from 'axios';
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

const depositRequestWithFallback = async (method, url, payload) => {
  try {
    if (method === 'get') {
      return await axiosClient.get(url);
    }
    return await axiosClient.post(url, payload);
  } catch (error) {
    if (error.response?.status !== 404) {
      throw error;
    }

    if (method === 'get') {
      return axiosClientFallback.get(url, { headers: getAuthHeaders() });
    }
    return axiosClientFallback.post(url, payload, { headers: getAuthHeaders() });
  }
};

export const clientDepositService = {
  getAccounts: async () => {
    try {
      const response = await depositRequestWithFallback('get', '/accounts');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching client accounts:', error);
      throw error;
    }
  },

  createDepositRequest: async (payload) => {
    try {
      const response = await depositRequestWithFallback('post', '/accounts/deposit-requests', payload);
      return response.data;
    } catch (error) {
      console.error('Error creating deposit request:', error);
      throw error;
    }
  }
};
