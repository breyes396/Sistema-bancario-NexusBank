import { StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZE } from '../../../shared/constants/theme';

export default StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: COLORS.background,
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
        color: COLORS.primary,
        fontWeight: '600',
    },
    title: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    subtitle: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textLight,
        lineHeight: 18,
    },
    filtersContainer: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.sm,
        gap: SPACING.sm,
    },
    searchInput: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        fontSize: FONT_SIZE.sm,
        color: COLORS.text,
        backgroundColor: COLORS.surface,
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
        borderColor: COLORS.border,
        borderRadius: 10,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        backgroundColor: COLORS.surface,
    },
    dropdownHalf: {
        flex: 1,
    },
    filterSelectorText: {
        fontSize: FONT_SIZE.xs + 1,
        fontWeight: '600',
        color: COLORS.text,
    },
    arrowIcon: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textLight,
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
        borderBottomColor: COLORS.border,
        paddingBottom: SPACING.sm,
    },
    cardType: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textLight,
        fontWeight: '500',
        marginBottom: 2,
    },
    cardAmount: {
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
        color: COLORS.text,
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
        color: COLORS.textLight,
    },
    detailValue: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '600',
        color: COLORS.text,
    },
    detailBlock: {
        marginTop: 4,
    },
    reasonText: {
        fontSize: FONT_SIZE.xs + 1,
        color: COLORS.text,
        backgroundColor: COLORS.background,
        padding: SPACING.xs + 2,
        borderRadius: 6,
        marginTop: 4,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    adminCommentBlock: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    adminCommentLabel: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.error,
        fontWeight: '600',
    },
    adminCommentText: {
        fontSize: FONT_SIZE.xs + 1,
        color: COLORS.text,
        fontStyle: 'italic',
        marginTop: 2,
    },
});
