import { useState, useEffect, useCallback } from 'react';
import userClient from '../../../shared/api/userClient';

export const useDeposit = () => {
    const [accounts, setAccounts] = useState([]);
    const [accountsLoading, setAccountsLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchAccounts = useCallback(async () => {
        try {
            setAccountsLoading(true);
            setError(null);
            const response = await userClient.get('/accounts');
            const raw = response.data?.data || response.data || [];
            const active = Array.isArray(raw)
                ? raw.filter((acc) => acc.accountStatus === 'ACTIVE' && acc.status === true)
                : [];
            setAccounts(active);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al cargar las cuentas');
        } finally {
            setAccountsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    const submitDeposit = async ({ destinationAccountNumber, amount, description }) => {
        setLoading(true);
        setError(null);
        try {
            const response = await userClient.post('/accounts/deposit-requests', {
                destinationAccountNumber,
                amount: parseFloat(amount),
                description: description?.trim() || 'Depósito móvil NexusBank',
            });
            return response.data?.data || response.data;
        } catch (err) {
            const message = err.response?.data?.message || 'Error al procesar el depósito';
            setError(message);
            throw new Error(message);
        } finally {
            setLoading(false);
        }
    };

    return { accounts, accountsLoading, loading, error, submitDeposit, fetchAccounts };
};
