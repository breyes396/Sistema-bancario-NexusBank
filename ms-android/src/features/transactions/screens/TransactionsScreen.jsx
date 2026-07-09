import React, { useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    useTransactions,
    isIncome,
    TYPE_LABELS,
    STATUS_LABELS,
} from '../hooks/useTransactions';
import { LoadingSpinner, EmptyState, Card } from '../../../shared/components/common/Common';
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from '../../../shared/constants/theme';

// Colors consistent with web app
const INCOME_COLOR = '#1A6637';
const EXPENSE_COLOR = '#7A1A1A';

const STATUS_COLORS = {
    COMPLETADA: COLORS.success,
    PENDIENTE: COLORS.warning,
    FALLIDA: COLORS.error,
    REVERTIDA: '#d63a3a',
};

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-GT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }) + ' ' + d.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
};

const formatAmount = (amount, type) => {
    const num = parseFloat(amount || 0).toFixed(2);
    return isIncome(type) ? `+Q${num}` : `-Q${num}`;
};

// ── Transaction card ──────────────────────────────────────────────────────────
const TransactionCard = ({ item }) => {
    const income = isIncome(item.type);
    const amountColor =
        item.status === 'REVERTIDA' ? STATUS_COLORS.REVERTIDA
        : income ? INCOME_COLOR
        : EXPENSE_COLOR;

    return (
        <Card style={card.container}>
            {/* Row 1: type badge + date */}
            <View style={card.row}>
                <View style={[card.badge, income ? card.badgeIncome : card.badgeExpense]}>
                    <Text style={[card.badgeText, { color: income ? INCOME_COLOR : EXPENSE_COLOR }]}>
                        {TYPE_LABELS[item.type] || item.type}
                    </Text>
                </View>
                <Text style={card.date}>{formatDate(item.createdAt)}</Text>
            </View>

            {/* Row 2: account + amount */}
            <View style={card.row}>
                <View style={card.accountWrap}>
                    <Text style={card.accountLabel}>Cuenta</Text>
                    <Text style={card.accountValue} numberOfLines={1}>
                        {item.accountNumber || '—'}
                    </Text>
                </View>
                <Text style={[card.amount, { color: amountColor }]}>
                    {formatAmount(item.amount, item.type)}
                </Text>
            </View>

            {/* Row 3: ID + status */}
            <View style={card.row}>
                <Text style={card.id} numberOfLines={1}>
                    ID: {item.id || '—'}
                </Text>
                <View style={[card.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '22' }]}>
                    <Text style={[card.statusText, { color: STATUS_COLORS[item.status] }]}>
                        {STATUS_LABELS[item.status] || item.status}
                    </Text>
                </View>
            </View>

            {/* Description (if present) */}
            {item.description ? (
                <Text style={card.description} numberOfLines={1}>
                    {item.description}
                </Text>
            ) : null}
        </Card>
    );
};

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
const TransactionsScreen = ({ navigation }) => {
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
    } = useTransactions();

    useEffect(() => {
        fetchTransactions({ pageNum: 1 });
    }, [fetchTransactions]);

    const renderItem = useCallback(({ item }) => <TransactionCard item={item} />, []);

    const keyExtractor = useCallback((item) => item.id?.toString() ?? Math.random().toString(), []);

    const renderFooter = () => {
        if (!pagination || pagination.page >= pagination.pages) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
        );
    };

    const renderHeader = () => (
        <View>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Volver</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Historial de Transacciones</Text>
                {pagination ? (
                    <Text style={styles.count}>{pagination.total} movimiento(s)</Text>
                ) : null}
            </View>
            <SummaryStrip summary={summary} />
        </View>
    );

    if (loading) return <LoadingSpinner />;

    if (error) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Text style={styles.backText}>← Volver</Text>
                    </TouchableOpacity>
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
                        colors={[COLORS.primary]}
                        tintColor={COLORS.primary}
                    />
                }
                onEndReached={loadMore}
                onEndReachedThreshold={0.3}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    list: {
        paddingBottom: SPACING.xxl,
    },
    header: {
        padding: SPACING.lg,
        paddingBottom: SPACING.sm,
    },
    backBtn: {
        marginBottom: SPACING.sm,
    },
    backText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.primary,
        fontWeight: '600',
    },
    title: {
        fontSize: FONT_SIZE.xl,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    count: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textLight,
    },
    footerLoader: {
        paddingVertical: SPACING.md,
        alignItems: 'center',
    },
});

const card = StyleSheet.create({
    container: {
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.sm,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    badge: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: 3,
        borderRadius: 6,
    },
    badgeIncome: {
        backgroundColor: INCOME_COLOR + '18',
    },
    badgeExpense: {
        backgroundColor: EXPENSE_COLOR + '18',
    },
    badgeText: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '700',
    },
    date: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textLight,
    },
    accountWrap: {
        flex: 1,
        marginRight: SPACING.sm,
    },
    accountLabel: {
        fontSize: 10,
        color: COLORS.textLight,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    accountValue: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text,
        fontWeight: '500',
    },
    amount: {
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
    },
    id: {
        fontSize: 10,
        color: COLORS.textLight,
        flex: 1,
        marginRight: SPACING.sm,
    },
    statusBadge: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    description: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textLight,
        marginTop: SPACING.xs,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: SPACING.xs,
    },
});

const strip = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.sm,
    },
    item: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: SPACING.md,
    },
    divider: {
        width: 1,
        backgroundColor: COLORS.border,
        marginVertical: SPACING.sm,
    },
    label: {
        fontSize: 10,
        color: COLORS.textLight,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    value: {
        fontSize: FONT_SIZE.sm,
        fontWeight: 'bold',
    },
});

export default TransactionsScreen;
