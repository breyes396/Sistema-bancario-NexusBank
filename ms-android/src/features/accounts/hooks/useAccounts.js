import { useState, useEffect, useCallback } from 'react';
import userClient from '../../../shared/api/userClient';

const getAccountSortTimestamp = (account) => {
  const value = account?.openedAt || account?.createdAt || account?.updatedAt || 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const sortAccountsForDisplay = (accounts = []) => {
  return [...accounts].sort((left, right) => {
    const leftStatus = String(left?.accountStatus || '').toUpperCase();
    const rightStatus = String(right?.accountStatus || '').toUpperCase();

    if (leftStatus === 'ACTIVE' && rightStatus !== 'ACTIVE') return -1;
    if (rightStatus === 'ACTIVE' && leftStatus !== 'ACTIVE') return 1;

    const leftTime = getAccountSortTimestamp(left);
    const rightTime = getAccountSortTimestamp(right);

    if (leftTime !== rightTime) return leftTime - rightTime;

    return String(left?.accountNumber || '').localeCompare(String(right?.accountNumber || ''));
  });
};

export const useAccounts = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchAccounts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await userClient.get('/accounts');
            const raw = response.data?.data || response.data || [];
            const sorted = sortAccountsForDisplay(raw);
            setAccounts(sorted);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al cargar las cuentas');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    return { accounts, loading, error, refetch: fetchAccounts };
};
