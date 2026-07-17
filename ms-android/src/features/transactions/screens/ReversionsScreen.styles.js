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
    filtersContainer: {
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
    selectRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    filterSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: BANK.border,
        borderRadius: 10,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        backgroundColor: BANK.surface,
    },
    dropdownHalf: {
        flex: 1,
    },
    filterSelectorText: {
        fontSize: FONT_SIZE.xs + 1,
        fontWeight: '600',
        color: BANK.text,
    },
    arrowIcon: {
        fontSize: FONT_SIZE.xs,
        color: BANK.textMuted,
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
        borderBottomWidth: 1,
        borderBottomColor: BANK.border,
        paddingBottom: SPACING.sm,
    },
    cardType: {
        fontSize: FONT_SIZE.xs,
        color: BANK.textMuted,
        fontWeight: '500',
        marginBottom: 2,
    },
    cardAmount: {
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
        color: BANK.text,
    },
    statusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
    },
    statusText: {
        fontSize: FONT_SIZE.xs - 1,
        fontWeight: '700',
    },
    detailsContainer: {
        paddingTop: SPACING.sm,
        gap: 6,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailLabel: {
        fontSize: FONT_SIZE.xs,
        color: BANK.textMuted,
    },
    detailValue: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '600',
        color: BANK.text,
    },
    detailBlock: {
        marginTop: 4,
    },
    reasonText: {
        fontSize: FONT_SIZE.xs + 1,
        color: BANK.text,
        backgroundColor: BANK.background,
        padding: SPACING.xs + 2,
        borderRadius: 6,
        marginTop: 4,
        borderWidth: 1,
        borderColor: BANK.border,
    },
    adminCommentBlock: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: BANK.border,
    },
    adminCommentLabel: {
        fontSize: FONT_SIZE.xs,
        color: BANK.error,
        fontWeight: '600',
    },
    adminCommentText: {
        fontSize: FONT_SIZE.xs + 1,
        color: BANK.text,
        fontStyle: 'italic',
        marginTop: 2,
    },
});
