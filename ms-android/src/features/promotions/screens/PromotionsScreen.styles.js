import { StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from '../../../shared/constants/theme';

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
    toolbar: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.sm,
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
    listContent: {
        padding: SPACING.lg,
        paddingTop: SPACING.xs,
        paddingBottom: SPACING.xxl,
    },
    card: {
        marginBottom: SPACING.md,
        padding: 0,
        overflow: 'hidden',
    },
    cardBanner: {
        height: 8,
        backgroundColor: COLORS.primary,
    },
    cardBody: {
        padding: SPACING.md,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.xs,
    },
    typeBadge: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
        backgroundColor: COLORS.primary + '18',
        marginBottom: SPACING.xs,
    },
    typeBadgeText: {
        fontSize: FONT_SIZE.xs - 1,
        fontWeight: '700',
        color: COLORS.primary,
    },
    name: {
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    description: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textLight,
        lineHeight: 18,
        marginBottom: SPACING.sm,
    },
    benefitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: SPACING.xs,
    },
    benefitText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.text,
    },
    validityText: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textLight,
        marginBottom: SPACING.md,
    },
    useBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: SPACING.sm + 2,
        borderRadius: 8,
        backgroundColor: COLORS.primary,
    },
    useBtnText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: '#fff',
    },
    errorCard: {
        backgroundColor: '#fef2f2',
        borderColor: COLORS.error,
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.sm,
        padding: SPACING.md,
        borderRadius: 10,
        borderWidth: 1,
    },
    errorCardText: {
        color: COLORS.error,
        fontSize: FONT_SIZE.sm,
        textAlign: 'center',
    },
    // Modal de detalle
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        ...SHADOWS.md,
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    sheetTitle: {
        flex: 1,
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
        color: COLORS.text,
        marginRight: SPACING.sm,
    },
    close: {
        fontSize: FONT_SIZE.lg,
        color: COLORS.textLight,
        paddingHorizontal: SPACING.sm,
    },
    sheetBody: {
        padding: SPACING.lg,
    },
    sectionLabel: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '700',
        color: COLORS.textLight,
        textTransform: 'uppercase',
        marginBottom: 4,
        marginTop: SPACING.md,
    },
    sectionText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text,
        lineHeight: 20,
    },
    codeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        backgroundColor: COLORS.background,
    },
    codeText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.text,
    },
    copyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    copyBtnText: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '600',
        color: COLORS.primary,
    },
});
