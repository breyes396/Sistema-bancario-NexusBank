import { StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from '../../../shared/constants/theme';

export default StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    container: {
        padding: SPACING.lg,
        paddingBottom: SPACING.xxl,
    },
    header: {
        marginBottom: SPACING.xl,
    },
    backBtn: {
        marginBottom: SPACING.md,
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
        lineHeight: 20,
    },
    section: {
        marginBottom: SPACING.md,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    label: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.text,
    },
    favoritesShortcut: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    favoritesShortcutText: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '600',
        color: COLORS.primary,
    },
    picker: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        paddingVertical: SPACING.sm + 2,
        paddingHorizontal: SPACING.md,
        backgroundColor: COLORS.surface,
    },
    pickerError: {
        borderColor: COLORS.error,
    },
    pickerValue: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
        fontWeight: '500',
    },
    pickerSub: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textLight,
        marginTop: 2,
    },
    pickerPlaceholder: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textLight,
    },
    pickerArrow: {
        fontSize: 12,
        color: COLORS.textLight,
    },
    toggleRow: {
        flexDirection: 'row',
        backgroundColor: COLORS.border,
        borderRadius: 10,
        padding: 4,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: SPACING.sm + 2,
        alignItems: 'center',
        borderRadius: 8,
    },
    toggleBtnActive: {
        backgroundColor: COLORS.surface,
        ...SHADOWS.sm,
    },
    toggleBtnText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.textLight,
    },
    toggleBtnTextActive: {
        color: COLORS.primary,
    },
    errorText: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.error,
        marginTop: SPACING.xs,
    },
    errorCard: {
        backgroundColor: '#fef2f2',
        borderColor: COLORS.error,
        marginBottom: SPACING.md,
    },
    errorCardText: {
        color: COLORS.error,
        fontSize: FONT_SIZE.sm,
        textAlign: 'center',
    },
});
