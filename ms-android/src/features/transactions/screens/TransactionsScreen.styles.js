import { StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from '../../../shared/constants/theme';

export default StyleSheet.create({
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

// ── SummaryStrip (TransactionsScreen) ──────────────────────────────────────────
export const strip = StyleSheet.create({
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

// ── TransactionCard (used only by TransactionsScreen) ──────────────────────────
export const card = StyleSheet.create({
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
        backgroundColor: '#1A663718',
    },
    badgeExpense: {
        backgroundColor: '#7A1A1A18',
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

// ── RevertReasonModal (used only by TransactionsScreen) ────────────────────────
export const revertModal = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    modalCard: {
        width: '100%',
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: SPACING.lg,
        ...SHADOWS.md,
    },
    modalTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.xs,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textLight,
        lineHeight: 18,
        textAlign: 'center',
        marginBottom: SPACING.md,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        padding: SPACING.sm,
        fontSize: FONT_SIZE.sm,
        color: COLORS.text,
        backgroundColor: COLORS.background,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: SPACING.md,
    },
    modalBtnRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: SPACING.sm + 4,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalBtnCancel: {
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    modalBtnCancelText: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textLight,
        fontWeight: '600',
    },
    modalBtnConfirm: {
        backgroundColor: COLORS.primary,
    },
    modalBtnConfirmText: {
        fontSize: FONT_SIZE.md,
        color: '#fff',
        fontWeight: '600',
    },
});
