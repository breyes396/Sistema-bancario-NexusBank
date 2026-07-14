import { StyleSheet } from 'react-native';
import { SPACING, FONT_SIZE } from '../../../shared/constants/theme';
import { BANK_DARK as BANK } from '../../../shared/constants/colors';

export default StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: BANK.background,
    },
    header: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
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
        fontSize: FONT_SIZE.xxl,
        fontWeight: 'bold',
        color: BANK.text,
        marginBottom: SPACING.xs,
    },
    subtitle: {
        fontSize: FONT_SIZE.sm,
        color: BANK.textMuted,
        lineHeight: 18,
    },
    toolbar: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.sm,
        gap: SPACING.sm,
    },
    searchInput: {
        borderWidth: 1,
        borderColor: BANK.border,
        borderRadius: 10,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        fontSize: FONT_SIZE.sm,
        color: BANK.text,
        backgroundColor: BANK.surface,
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
        borderWidth: 1.5,
        borderColor: BANK.primary,
        borderStyle: 'dashed',
        borderRadius: 10,
        paddingVertical: SPACING.sm + 2,
    },
    addBtnText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: BANK.primary,
    },
    listContent: {
        padding: SPACING.lg,
        paddingTop: SPACING.xs,
        paddingBottom: SPACING.xxl,
    },
    card: {
        marginBottom: SPACING.md,
        padding: SPACING.md,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    alias: {
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
        color: BANK.text,
    },
    accountNumber: {
        fontSize: FONT_SIZE.xs,
        color: BANK.textMuted,
        marginTop: 2,
    },
    typeBadge: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
        backgroundColor: BANK.primary + '18',
    },
    typeBadgeText: {
        fontSize: FONT_SIZE.xs - 1,
        fontWeight: '700',
        color: BANK.primary,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginTop: SPACING.md,
        paddingTop: SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: BANK.border,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: SPACING.sm,
        borderRadius: 8,
    },
    actionBtnText: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '600',
    },
    errorCard: {
        backgroundColor: BANK.surface,
        borderColor: BANK.error,
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.sm,
        padding: SPACING.md,
        borderRadius: 10,
        borderWidth: 1,
    },
    errorCardText: {
        color: BANK.error,
        fontSize: FONT_SIZE.sm,
        textAlign: 'center',
    },
});
