
import { axiosAuth } from './api.js';

export const login = async (data) => {
  return axiosAuth.post('/auth/login', data);
};

export const forgotPassword = async (data) => {
  return axiosAuth.post('/auth/forgot-password', data);
};

export const resetPassword = async (data) => {
  return axiosAuth.post('/auth/reset-password', data);
};

export const refreshSession = async (refreshToken) => {
  return axiosAuth.post('/auth/refresh', { refreshToken });
};

