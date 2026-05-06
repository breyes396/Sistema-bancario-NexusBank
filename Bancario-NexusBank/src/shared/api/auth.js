import { axiosAuthClient } from './api.js';

export const login = async (data) => {
  return axiosAuthClient.post('/auth/login', data);
};

export const forgotPassword = async (data) => {
  return axiosAuthClient.post('/auth/forgot-password', data);
};

export const resetPassword = async (data) => {
  return axiosAuthClient.post('/auth/reset-password', data);
};