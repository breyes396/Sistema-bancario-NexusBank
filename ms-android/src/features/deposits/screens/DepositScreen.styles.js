import { StyleSheet } from 'react-native';
import { SPACING, FONT_SIZE, SHADOWS } from '../../../shared/constants/theme';
import { BANK_DARK as BANK } from '../../../shared/constants/colors';

export default StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: BANK.background,
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
        lineHeight: 20,
    },
    section: {
        marginBottom: SPACING.md,
    },
    label: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: BANK.text,
        marginBottom: SPACING.xs,
    },
    toggleRow: {
        flexDirection: 'row',
        backgroundColor: BANK.border,
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
        backgroundColor: BANK.surface,
        ...SHADOWS.sm,
    },
    toggleBtnText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: BANK.textMuted,
    },
    toggleBtnTextActive: {
        color: BANK.primary,
    },
    picker: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: BANK.border,
        borderRadius: 10,
        paddingVertical: SPACING.sm + 2,
        paddingHorizontal: SPACING.md,
        backgroundColor: BANK.surface,
    },
    pickerError: {
        borderColor: BANK.error,
    },
    pickerValue: {
        fontSize: FONT_SIZE.md,
        color: BANK.text,
        fontWeight: '500',
    },
    pickerSub: {
        fontSize: FONT_SIZE.xs,
        color: BANK.textMuted,
        marginTop: 2,
    },
    pickerPlaceholder: {
        fontSize: FONT_SIZE.md,
        color: BANK.textMuted,
    },
    pickerArrow: {
        fontSize: 12,
        color: BANK.textMuted,
    },
    errorText: {
        fontSize: FONT_SIZE.xs,
        color: BANK.error,
        marginTop: SPACING.xs,
    },
    errorCard: {
        backgroundColor: BANK.surface,
        borderColor: BANK.error,
        marginBottom: SPACING.md,
    },
    errorCardText: {
        color: BANK.error,
        fontSize: FONT_SIZE.sm,
        textAlign: 'center',
    },
    infoCard: {
        backgroundColor: BANK.surface,
        borderColor: BANK.accentLight,
        marginBottom: SPACING.lg,
    },
    infoText: {
        fontSize: FONT_SIZE.xs,
        color: BANK.primary,
        lineHeight: 18,
    },
    infoBold: {
        fontWeight: 'bold',
    },
});

export const modal = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(5,15,34,0.5)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: BANK.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '60%',
        paddingBottom: SPACING.xl,
        ...SHADOWS.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: BANK.border,
    },
    title: {
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
        color: BANK.text,
    },
    close: {
        fontSize: FONT_SIZE.lg,
        color: BANK.textMuted,
        paddingHorizontal: SPACING.sm,
    },
    item: {
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: BANK.border,
    },
    itemSelected: {
        backgroundColor: BANK.accentLight + '33',
    },
    itemNumber: {
        fontSize: FONT_SIZE.md,
        color: BANK.text,
        fontWeight: '600',
    },
    itemSub: {
        fontSize: FONT_SIZE.xs,
        color: BANK.textMuted,
        marginTop: 2,
    },
});
