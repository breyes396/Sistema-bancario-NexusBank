import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AppRoutes } from './router/AppRoutes.jsx';
import { useAuthStore } from '../features/auth/store/authStore.js';

const REFRESH_LEAD_TIME_MS = 60 * 1000;
const MIN_REFRESH_DELAY_MS = 5 * 1000;

const formatGuatemalaTime = (dateValue) => {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);

  return new Intl.DateTimeFormat('es-GT', {
    timeZone: 'America/Guatemala',
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date);
};

const SessionRefreshManager = () => {
  const token = useAuthStore((state) => state.token);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const expiresAt = useAuthStore((state) => state.expiresAt);

  useEffect(() => {
    let timeoutId = null;

    const scheduleRefresh = () => {
      if (!token || !refreshToken || !expiresAt) return;

      const expirationMs = new Date(expiresAt).getTime();
      if (Number.isNaN(expirationMs)) return;

      const now = Date.now();
      const delay = Math.max(expirationMs - now - REFRESH_LEAD_TIME_MS, MIN_REFRESH_DELAY_MS);
      const runAt = formatGuatemalaTime(new Date(now + delay));
      const expiresAtLocal = formatGuatemalaTime(expiresAt);
      console.info('[AuthRefresh] Refresh programado para:', runAt, 'expiresAt:', expiresAtLocal);

      timeoutId = window.setTimeout(async () => {
        console.info('[AuthRefresh] Ejecutando refresh programado...');
        const { refreshSession } = useAuthStore.getState();
        const result = await refreshSession();
        if (result?.success) {
          console.info('[AuthRefresh] Refresh programado completado con exito.');
        } else {
          console.warn('[AuthRefresh] Refresh programado fallo:', result?.error || 'sin detalle');
        }
      }, delay);
    };

    scheduleRefresh();

    const handleVisibilityOrFocus = async () => {
      const { token: currentToken, refreshToken: currentRefreshToken, expiresAt: currentExpiresAt } = useAuthStore.getState();
      if (!currentToken || !currentRefreshToken || !currentExpiresAt) return;

      const expirationMs = new Date(currentExpiresAt).getTime();
      if (Number.isNaN(expirationMs)) return;

      const shouldRefreshNow = expirationMs - Date.now() <= REFRESH_LEAD_TIME_MS;
      if (shouldRefreshNow) {
        console.info('[AuthRefresh] App en focus/visible y token cercano a expirar. Ejecutando refresh...');
        const { refreshSession } = useAuthStore.getState();
        const result = await refreshSession();
        if (result?.success) {
          console.info('[AuthRefresh] Refresh por focus/visibility completado con exito.');
        } else {
          console.warn('[AuthRefresh] Refresh por focus/visibility fallo:', result?.error || 'sin detalle');
        }
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [token, refreshToken, expiresAt]);

  return null;
};

export const App = () => {
  return (
    <>
      <SessionRefreshManager />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: '12px',
            fontFamily: 'inherit',
            fontWeight: 600,
          },
        }}
      />
      <AppRoutes />
    </>
  );
};