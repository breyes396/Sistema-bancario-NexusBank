import { useState, useEffect, useCallback } from 'react';
import userClient from '../../../shared/api/userClient';

export const useTransfer = () => {
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
                ? raw.filter((acc) => String(acc.accountStatus).toUpperCase() === 'ACTIVE' && acc.status === true)
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

    const getExchangeRate = useCallback(async (accountId, targetCurrency) => {
        const response = await userClient.get('/my-account/balance/convert', {
            params: { accountId, targetCurrency },
        });
        return response.data?.data || response.data;
    }, []);

    const submitTransfer = async ({
        sourceAccountNumber,
        destinationAccountNumber,
        recipientType,
        amount,
        description,
        currency = 'GTQ'
    }) => {
        setLoading(true);
        setError(null);
        try {
            const response = await userClient.post('/accounts/transfers', {
                sourceAccountNumber,
                destinationAccountNumber,
                recipientType,
                amount: parseFloat(amount),
                description: description?.trim() || `Transferencia ${recipientType.toLowerCase()}`,
                currency,
            });
            return response.data?.data || response.data;
        } catch (err) {
            const message = err.response?.data?.message || 'Error al procesar la transferencia';
            setError(message);
            throw new Error(message);
        } finally {
            setLoading(false);
        }
    };

    return { accounts, accountsLoading, loading, error, submitTransfer, fetchAccounts, getExchangeRate };
};
