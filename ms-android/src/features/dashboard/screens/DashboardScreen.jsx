import React, { useState, useEffect, useMemo } from 'react';
import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../shared/store/authStore';
import { useAccounts } from '../../accounts/hooks/useAccounts';
import { useTransactions } from '../../transactions/hooks/useTransactions';
import DashboardHeader from '../components/DashboardHeader';
import BalanceCard from '../components/BalanceCard';
import SummaryCards from '../components/SummaryCards';
import FavoritesSection from '../components/FavoritesSection';
import RecentMovements from '../components/RecentMovements';
import BottomNavBar from '../components/BottomNavBar';
import styles from './DashboardScreen.styles';

const DashboardScreen = ({ navigation }) => {
    const user = useAuthStore((state) => state.user);
    const { accounts, loading: accountsLoading } = useAccounts();
    const { transactions, summary, loading: txLoading } = useTransactions();

    const [updatedAt, setUpdatedAt] = useState(null);

    useEffect(() => {
        if (!accountsLoading) setUpdatedAt(new Date());
    }, [accountsLoading, accounts]);

    const fullName = user?.name || user?.username || 'Usuario';
    const firstName = fullName.split(' ')[0];

    const consolidatedBalance = useMemo(() => {
        return accounts
            .filter((acc) => String(acc?.accountStatus).toUpperCase() === 'ACTIVE')
            .reduce((sum, acc) => sum + parseFloat(acc?.accountBalance || 0), 0);
    }, [accounts]);

    const openDrawer = () => navigation.getParent()?.openDrawer();

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <DashboardHeader fullName={fullName} openDrawer={openDrawer} />

                <Text style={styles.greeting}>Hola, {firstName}</Text>
                <Text style={styles.subtitle}>Esto es lo que pasa en tus cuentas hoy</Text>

                <BalanceCard
                    consolidatedBalance={consolidatedBalance}
                    updatedAt={updatedAt}
                    loading={accountsLoading}
                />
                <SummaryCards summary={summary} loading={txLoading} />
                <FavoritesSection navigation={navigation} />
                <RecentMovements transactions={transactions} loading={txLoading} />
            </ScrollView>

            <BottomNavBar openDrawer={openDrawer} navigation={navigation} />
        </SafeAreaView>
    );
};

export default DashboardScreen;
