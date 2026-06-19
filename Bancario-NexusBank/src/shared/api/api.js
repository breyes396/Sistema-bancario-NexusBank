import axios from 'axios';
import { useAuthStore } from '../../features/auth/store/authStore.js';

const baseURL = import.meta.env.VITE_BANKING_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3007/api/v1';
const authURL = import.meta.env.VITE_AUTH_URL || 'http://localhost:3007/api/v1';

export const axiosAuth = axios.create({
  baseURL: authURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise = null;

const formatGuatemalaTime = (dateValue) => {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);

  return new Intl.DateTimeFormat('es-GT', {
    timeZone: 'America/Guatemala',
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date);
};

const attachBearerToken = (config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

const isRefreshRequest = (url = '') => url.includes('/auth/refresh');
const isLoginRequest = (url = '') => url.includes('/auth/login');

const tryRefreshSession = async () => {
  if (!refreshPromise) {
    console.info('[AuthRefresh] Iniciando refresh de sesion...');
    refreshPromise = useAuthStore
      .getState()
      .refreshSession()
      .then((result) => {
        if (result?.success) {
          console.info('[AuthRefresh] Refresh exitoso. Token renovado a las:', formatGuatemalaTime(new Date()));
        } else {
          console.warn('[AuthRefresh] Refresh fallido:', result?.error || 'sin detalle');
        }
        return result;
      })
      .catch((error) => {
        console.error('[AuthRefresh] Error inesperado en refresh:', error);
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  } else {
    console.info('[AuthRefresh] Refresh en progreso, reutilizando promesa activa.');
  }

  return refreshPromise;
};

const shouldAttemptRefresh = (error) => {
  const status = error?.response?.status;
  const originalRequest = error?.config || {};
  const url = originalRequest?.url || '';
  const { token, refreshToken } = useAuthStore.getState();

  if (!token || !refreshToken) return false;
  if (![401, 403].includes(status)) return false;
  if (originalRequest._retry) return false;
  if (isRefreshRequest(url) || isLoginRequest(url)) return false;

  return true;
};

const attachRefreshInterceptor = (instance) => {
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (!shouldAttemptRefresh(error)) {
        return Promise.reject(error);
      }

      const originalRequest = error.config;
      originalRequest._retry = true;

      const refreshResult = await tryRefreshSession();
      if (!refreshResult?.success) {
        console.warn('[AuthRefresh] No se pudo renovar token. Se mantiene error original.');
        return Promise.reject(error);
      }

      const newToken = useAuthStore.getState().token;
      if (!newToken) {
        return Promise.reject(error);
      }

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      console.info('[AuthRefresh] Reintentando request original con nuevo token:', originalRequest.url);

      return instance(originalRequest);
    }
  );
};

// ensure auth requests include Authorization header when token is present
axiosAuth.interceptors.request.use(attachBearerToken);

export const axiosClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const axiosAdmin = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(attachBearerToken);

axiosAdmin.interceptors.request.use(attachBearerToken);

attachRefreshInterceptor(axiosAuth);
attachRefreshInterceptor(axiosClient);
attachRefreshInterceptor(axiosAdmin);