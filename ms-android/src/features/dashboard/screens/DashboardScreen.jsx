import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../../shared/store/authStore';
import { useAccounts } from '../../accounts/hooks/useAccounts';
import { useTransactions } from '../../transactions/hooks/useTransactions';
import DashboardHeader from '../components/DashboardHeader';
import BalanceCard from '../components/BalanceCard';
import SummaryCards from '../components/SummaryCards';
import FavoritesSection from '../components/FavoritesSection';
import RecentMovements from '../components/RecentMovements';
import BottomNavBar from '../../../shared/components/common/BottomNavBar';
import styles from './DashboardScreen.styles';

const DashboardScreen = ({ navigation }) => {
    const user = useAuthStore((state) => state.user);
    const { accounts, loading: accountsLoading, refetch: refetchAccounts } = useAccounts();
    const { transactions, summary, loading: txLoading, fetchTransactions } = useTransactions();

    const [updatedAt, setUpdatedAt] = useState(null);

    // Vuelve a pedir cuentas y movimientos cada vez que el Dashboard toma foco,
    // para que refleje depósitos/transferencias aprobados mientras estabas en otra pantalla.
    useFocusEffect(
        useCallback(() => {
            refetchAccounts();
            fetchTransactions({ pageNum: 1 });
        }, [refetchAccounts, fetchTransactions])
    );

    useEffect(() => {
        if (!accountsLoading) setUpdatedAt(new Date());
    }, [accountsLoading, accounts]);

    const fullName = user?.name || user?.username || 'Usuario';
    const firstName = fullName.split(' ')[0];

    // La cuenta principal es la primera cuenta activa (la más antigua): useAccounts
    // ya devuelve el arreglo ordenado con activas primero y por fecha de creación.
    const mainAccountBalance = useMemo(() => {
        const mainAccount = accounts.find(
            (acc) => String(acc?.accountStatus).toUpperCase() === 'ACTIVE'
        );
        return parseFloat(mainAccount?.accountBalance || 0);
    }, [accounts]);

    const openDrawer = () => navigation.getParent()?.openDrawer();

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <DashboardHeader fullName={fullName} openDrawer={openDrawer} />

                <Text style={styles.greeting}>Hola, {firstName}</Text>
                <Text style={styles.subtitle}>Esto es lo que pasa en tus cuentas hoy</Text>

                <BalanceCard
                    balance={mainAccountBalance}
                    updatedAt={updatedAt}
                    loading={accountsLoading}
                />
                <SummaryCards summary={summary} loading={txLoading} />
                <FavoritesSection navigation={navigation} />
                <RecentMovements transactions={transactions} loading={txLoading} />
            </ScrollView>

            <BottomNavBar navigation={navigation} />
        </SafeAreaView>
    );
};

export default DashboardScreen;
