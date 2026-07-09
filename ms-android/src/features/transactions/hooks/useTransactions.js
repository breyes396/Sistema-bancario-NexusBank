import { useState, useCallback } from 'react';
import userClient from '../../../shared/api/userClient';

// Consistent with web app classification
const INCOME_TYPES = ['DEPOSITO', 'TRANSFERENCIA_RECIBIDA'];

export const isIncome = (type) => INCOME_TYPES.includes(type);

export const TYPE_LABELS = {
    DEPOSITO: 'Depósito',
    RETIRO: 'Retiro',
    TRANSFERENCIA_ENVIADA: 'Transf. Enviada',
    TRANSFERENCIA_RECIBIDA: 'Transf. Recibida',
    COMPRA: 'Compra',
};

export const STATUS_LABELS = {
    COMPLETADA: 'Completada',
    PENDIENTE: 'Pendiente',
    FALLIDA: 'Fallida',
    REVERTIDA: 'Revertida',
};

export const useTransactions = (accountId = null) => {
    const [transactions, setTransactions] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchTransactions = useCallback(async ({ pageNum = 1, isRefresh = false } = {}) => {
        if (isRefresh) {
            setRefreshing(true);
        } else if (pageNum === 1) {
            setLoading(true);
        }
        setError(null);

        try {
            const response = await userClient.get('/my-account/history', {
                params: { 
                    page: pageNum, 
                    limit: 20,
                    ...(accountId ? { accountId } : {})
                },
            });

            const { transactions: data, pagination: pag, summary: sum } =
                response.data?.data || {};

            if (pageNum === 1 || isRefresh) {
                setTransactions(data || []);
            } else {
                setTransactions((prev) => [...prev, ...(data || [])]);
            }

            setPagination(pag || null);
            setSummary(sum || null);
            setCurrentPage(pageNum);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al cargar el historial');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const refresh = useCallback(() => {
        fetchTransactions({ pageNum: 1, isRefresh: true });
    }, [fetchTransactions]);

    const loadMore = useCallback(() => {
        if (pagination && currentPage < pagination.pages) {
            fetchTransactions({ pageNum: currentPage + 1 });
        }
    }, [pagination, currentPage, fetchTransactions]);

    return {
        transactions,
        pagination,
        summary,
        loading,
        refreshing,
        error,
        fetchTransactions,
        refresh,
        loadMore,
    };
};
