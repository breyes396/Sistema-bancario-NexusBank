import React, { useEffect, useCallback, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    useTransactions,
} from '../hooks/useTransactions';
import { useReversions } from '../hooks/useReversions';
import { LoadingSpinner, EmptyState } from '../../../shared/components/common/Common';
import HeaderMenuButton from '../../../shared/components/common/HeaderMenuButton';
import { BANK_DARK as BANK } from '../../../shared/constants/colors';
import TransactionCard from '../components/TransactionCard';
import RevertReasonModal from '../components/RevertReasonModal';
import styles, { strip } from './TransactionsScreen.styles';

// Colors consistent with web app
const INCOME_COLOR = '#1A6637';
const EXPENSE_COLOR = '#7A1A1A';

// ── Summary strip ─────────────────────────────────────────────────────────────
const SummaryStrip = ({ summary }) => {
    if (!summary) return null;
    return (
        <View style={strip.container}>
            <View style={strip.item}>
                <Text style={strip.label}>Ingresos</Text>
                <Text style={[strip.value, { color: INCOME_COLOR }]}>
                    +Q{parseFloat(summary.totalIncome || 0).toFixed(2)}
                </Text>
            </View>
            <View style={strip.divider} />
            <View style={strip.item}>
                <Text style={strip.label}>Egresos</Text>
                <Text style={[strip.value, { color: EXPENSE_COLOR }]}>
                    -Q{parseFloat(summary.totalExpense || 0).toFixed(2)}
                </Text>
            </View>
            <View style={strip.divider} />
            <View style={strip.item}>
                <Text style={strip.label}>Neto</Text>
                <Text
                    style={[
                        strip.value,
                        {
                            color:
                                parseFloat(summary.netChange) >= 0 ? INCOME_COLOR : EXPENSE_COLOR,
                        },
                    ]}
                >
                    Q{parseFloat(summary.netChange || 0).toFixed(2)}
                </Text>
            </View>
        </View>
    );
};

// ── Main screen ───────────────────────────────────────────────────────────────
const TransactionsScreen = ({ navigation, route }) => {
    const { accountId, accountNumber } = route?.params || {};
    const {
        transactions,
        summary,
        pagination,
        loading,
        refreshing,
        error,
        fetchTransactions,
        refresh,
        loadMore,
    } = useTransactions(accountId);

    const { addReversion } = useReversions();
    
    // Reversion state
    const [selectedTx, setSelectedTx] = useState(null);
    const [revertReason, setRevertReason] = useState('');
    const [revertModalVisible, setRevertModalVisible] = useState(false);
    const [revertLoading, setRevertLoading] = useState(false);

    useEffect(() => {
        fetchTransactions({ pageNum: 1 });
    }, [fetchTransactions, accountId]);

    const handleOpenRevert = (tx) => {
        setSelectedTx(tx);
        setRevertReason('');
        setRevertModalVisible(true);
    };

    const handleConfirmRevert = async () => {
        if (!revertReason || revertReason.trim() === '') {
            Alert.alert('Error', 'Debes escribir una justificación para solicitar la reversión.');
            return;
        }

        setRevertModalVisible(false);
        setRevertLoading(true);

        try {
            const isTransfer = String(selectedTx.type).includes('TRANSFERENCIA');
            await addReversion({
                type: isTransfer ? 'TRANSFERENCIA' : 'DEPOSITO',
                operationId: selectedTx.id,
                reference: selectedTx.id,
                amount: selectedTx.amount,
                accountNumber: selectedTx.accountNumber || '',
                sourceAccountNumber: isTransfer ? selectedTx.accountNumber : '',
                destinationAccountNumber: isTransfer ? selectedTx.relatedAccountNumber : '',
                operationDate: selectedTx.createdAt,
                operationDescription: selectedTx.description || '',
                reason: revertReason
            });

            Alert.alert('Éxito', 'Solicitud de reversión enviada correctamente para revisión.');
            refresh();
        } catch (err) {
            Alert.alert('Error', err.message || 'No se pudo procesar la solicitud.');
        } finally {
            setRevertLoading(false);
        }
    };

    const renderItem = useCallback(({ item }) => (
        <TransactionCard item={item} onRevertPress={handleOpenRevert} />
    ), []);

    const keyExtractor = useCallback((item) => item.id?.toString() ?? Math.random().toString(), []);

    const renderFooter = () => {
        if (!pagination || pagination.page >= pagination.pages) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={BANK.primary} />
            </View>
        );
    };

    const renderHeader = () => (
        <View>
            <View style={styles.header}>
                <HeaderMenuButton navigation={navigation} style={styles.backBtn} />
                <Text style={styles.title}>
                    {accountNumber ? `Movimientos: ${accountNumber}` : 'Historial de Transacciones'}
                </Text>
                {pagination ? (
                    <Text style={styles.count}>{pagination.total} movimiento(s)</Text>
                ) : null}
            </View>
            <SummaryStrip summary={summary} />
        </View>
    );

    if (loading && transactions.length === 0) return <LoadingSpinner />;

    if (error) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.header}>
                    <HeaderMenuButton navigation={navigation} style={styles.backBtn} />
                    <Text style={styles.title}>Historial de Transacciones</Text>
                </View>
                <EmptyState message={error} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            <FlatList
                data={transactions}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                ListHeaderComponent={renderHeader}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={
                    <EmptyState message="No hay transacciones registradas aún." />
                }
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={refresh}
                        colors={[BANK.primary]}
                        tintColor={BANK.primary}
                    />
                }
                onEndReached={loadMore}
                onEndReachedThreshold={0.3}
                showsVerticalScrollIndicator={false}
            />

            <RevertReasonModal
                visible={revertModalVisible}
                onClose={() => setRevertModalVisible(false)}
                onConfirm={handleConfirmRevert}
                reason={revertReason}
                setReason={setRevertReason}
                transactionId={selectedTx?.id}
            />
        </SafeAreaView>
    );
};

export default TransactionsScreen;
