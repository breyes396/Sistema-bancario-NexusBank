
import { axiosAuth } from './api.js';

export const login = async (data) => {
  return axiosAuth.post('/auth/login', data);
};

