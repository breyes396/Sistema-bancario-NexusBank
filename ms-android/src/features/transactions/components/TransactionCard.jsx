import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Card } from '../../../shared/components/common/Common';
import { COLORS, SPACING, FONT_SIZE } from '../../../shared/constants/theme';
import { isIncome } from '../hooks/useTransactions';

const INCOME_COLOR = '#1A6637';
const EXPENSE_COLOR = '#7A1A1A';

const STATUS_LABELS = {
    COMPLETADA: 'Completada',
    PENDIENTE: 'Pendiente',
    FALLIDA: 'Fallida',
    REVERTIDA: 'Revertida',
};

const STATUS_COLORS = {
    COMPLETADA: COLORS.success,
    PENDIENTE: COLORS.warning,
    FALLIDA: COLORS.error,
    REVERTIDA: '#d63a3a',
};

const TYPE_LABELS = {
    DEPOSITO: 'Depósito',
    RETIRO: 'Retiro',
    TRANSFERENCIA_ENVIADA: 'Transf. Enviada',
    TRANSFERENCIA_RECIBIDA: 'Transf. Recibida',
    COMPRA: 'Compra',
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

const isWithinRevertWindow = (dateStr) => {
    if (!dateStr) return false;
    const created = new Date(dateStr).getTime();
    return (Date.now() - created) <= 60000; // 60 seconds
};

const TransactionCard = ({ item, onRevertPress }) => {
    const income = isIncome(item.type);
    const amountColor =
        item.status === 'REVERTIDA' ? STATUS_COLORS.REVERTIDA
        : income ? INCOME_COLOR
        : EXPENSE_COLOR;

    const canRevert = (item.type === 'TRANSFERENCIA_ENVIADA' || item.type === 'DEPOSITO') && item.status === 'COMPLETADA';
    const activeRevert = canRevert && isWithinRevertWindow(item.createdAt);

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

            {/* Reversion Action Button */}
            {canRevert && (
                <View style={card.revertContainer}>
                    <TouchableOpacity
                        style={[
                            card.revertBtn,
                            !activeRevert && card.revertBtnDisabled
                        ]}
                        disabled={!activeRevert}
                        onPress={() => onRevertPress(item)}
                        activeOpacity={0.7}
                    >
                        <Text style={[card.revertBtnText, !activeRevert && card.revertBtnTextDisabled]}>
                            {activeRevert ? 'Solicitar Reversión' : 'Reversión Expirada (1m)'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </Card>
    );
};

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
    revertContainer: {
        marginTop: SPACING.sm,
        paddingTop: SPACING.xs,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    revertBtn: {
        backgroundColor: '#fffbeb',
        borderWidth: 1,
        borderColor: '#fef3c7',
        borderRadius: 8,
        paddingVertical: 6,
        alignItems: 'center',
    },
    revertBtnDisabled: {
        backgroundColor: COLORS.background,
        borderColor: COLORS.border,
    },
    revertBtnText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#b45309',
    },
    revertBtnTextDisabled: {
        color: COLORS.textLight,
    },
});

export default TransactionCard;
