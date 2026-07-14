import { StyleSheet } from 'react-native';
import { SPACING, FONT_SIZE, SHADOWS } from '../../../shared/constants/theme';
import { BANK_DARK as BANK } from '../../../shared/constants/colors';

export default StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: BANK.background,
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
        color: BANK.primary,
        fontWeight: '600',
    },
    title: {
        fontSize: FONT_SIZE.xl,
        fontWeight: 'bold',
        color: BANK.text,
        marginBottom: SPACING.xs,
    },
    count: {
        fontSize: FONT_SIZE.xs,
        color: BANK.textMuted,
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
        backgroundColor: BANK.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: BANK.border,
        ...SHADOWS.sm,
    },
    item: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: SPACING.md,
    },
    divider: {
        width: 1,
        backgroundColor: BANK.border,
        marginVertical: SPACING.sm,
    },
    label: {
        fontSize: 10,
        color: BANK.textMuted,
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
        backgroundColor: BANK.income + '33',
    },
    badgeExpense: {
        backgroundColor: BANK.expense + '33',
    },
    badgeText: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '700',
    },
    date: {
        fontSize: FONT_SIZE.xs,
        color: BANK.textMuted,
    },
    accountWrap: {
        flex: 1,
        marginRight: SPACING.sm,
    },
    accountLabel: {
        fontSize: 10,
        color: BANK.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    accountValue: {
        fontSize: FONT_SIZE.sm,
        color: BANK.text,
        fontWeight: '500',
    },
    amount: {
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
    },
    id: {
        fontSize: 10,
        color: BANK.textMuted,
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
        color: BANK.textMuted,
        marginTop: SPACING.xs,
        borderTopWidth: 1,
        borderTopColor: BANK.border,
        paddingTop: SPACING.xs,
    },
    revertContainer: {
        marginTop: SPACING.sm,
        paddingTop: SPACING.xs,
        borderTopWidth: 1,
        borderTopColor: BANK.border,
    },
    revertBtn: {
        backgroundColor: BANK.accentLight + '33',
        borderWidth: 1,
        borderColor: BANK.accentLight,
        borderRadius: 8,
        paddingVertical: 6,
        alignItems: 'center',
    },
    revertBtnDisabled: {
        backgroundColor: BANK.background,
        borderColor: BANK.border,
    },
    revertBtnText: {
        fontSize: 11,
        fontWeight: '700',
        color: BANK.accent,
    },
    revertBtnTextDisabled: {
        color: BANK.textMuted,
    },
});

// ── RevertReasonModal (used only by TransactionsScreen) ────────────────────────
export const revertModal = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(5,15,34,0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    modalCard: {
        width: '100%',
        backgroundColor: BANK.surface,
        borderRadius: 16,
        padding: SPACING.lg,
        ...SHADOWS.md,
    },
    modalTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
        color: BANK.text,
        marginBottom: SPACING.xs,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: FONT_SIZE.sm,
        color: BANK.textMuted,
        lineHeight: 18,
        textAlign: 'center',
        marginBottom: SPACING.md,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: BANK.border,
        borderRadius: 10,
        padding: SPACING.sm,
        fontSize: FONT_SIZE.sm,
        color: BANK.text,
        backgroundColor: BANK.background,
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
        borderColor: BANK.border,
        backgroundColor: BANK.surface,
    },
    modalBtnCancelText: {
        fontSize: FONT_SIZE.md,
        color: BANK.textMuted,
        fontWeight: '600',
    },
    modalBtnConfirm: {
        backgroundColor: BANK.primary,
    },
    modalBtnConfirmText: {
        fontSize: FONT_SIZE.md,
        color: BANK.onPrimary,
        fontWeight: '600',
    },
});
