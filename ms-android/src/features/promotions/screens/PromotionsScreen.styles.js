import { StyleSheet } from 'react-native';
import { SPACING, FONT_SIZE, SHADOWS } from '../../../shared/constants/theme';
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
        backgroundColor: BANK.accent,
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
        backgroundColor: BANK.primary + '18',
        marginBottom: SPACING.xs,
    },
    typeBadgeText: {
        fontSize: FONT_SIZE.xs - 1,
        fontWeight: '700',
        color: BANK.primary,
    },
    name: {
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
        color: BANK.text,
        marginBottom: 4,
    },
    description: {
        fontSize: FONT_SIZE.sm,
        color: BANK.textMuted,
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
        color: BANK.text,
    },
    validityText: {
        fontSize: FONT_SIZE.xs,
        color: BANK.textMuted,
        marginBottom: SPACING.md,
    },
    useBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: SPACING.sm + 2,
        borderRadius: 8,
        backgroundColor: BANK.primary,
    },
    useBtnText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: BANK.onPrimary,
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
    // Modal de detalle
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(5,15,34,0.5)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: BANK.surface,
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
        borderBottomColor: BANK.border,
    },
    sheetTitle: {
        flex: 1,
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
        color: BANK.text,
        marginRight: SPACING.sm,
    },
    close: {
        fontSize: FONT_SIZE.lg,
        color: BANK.textMuted,
        paddingHorizontal: SPACING.sm,
    },
    sheetBody: {
        padding: SPACING.lg,
    },
    sectionLabel: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '700',
        color: BANK.textMuted,
        textTransform: 'uppercase',
        marginBottom: 4,
        marginTop: SPACING.md,
    },
    sectionText: {
        fontSize: FONT_SIZE.sm,
        color: BANK.text,
        lineHeight: 20,
    },
    codeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: BANK.border,
        borderRadius: 10,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        backgroundColor: BANK.background,
    },
    codeText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: BANK.text,
    },
    copyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    copyBtnText: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '600',
        color: BANK.accent,
    },
});
