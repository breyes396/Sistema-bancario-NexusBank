import { axiosClient } from './api.js';

export const login = async (data) => {
  return axiosClient.post('/auth/login', data);
};

export const forgotPassword = async (data) => {
  return axiosClient.post('/auth/forgot-password', data);
};

export const resetPassword = async (data) => {
  return axiosClient.post('/auth/reset-password', data);
};