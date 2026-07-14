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
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xs,
    },
    label: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: BANK.text,
    },
    favoritesShortcut: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    favoritesShortcutText: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '600',
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
});

// ── AccountPickerModal (used only by TransferScreen) ────────────────────────────
export const accountPicker = StyleSheet.create({
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

// ── SecurityConfirmModal (used only by TransferScreen) ──────────────────────────
export const securityModal = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(5,15,34,0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    card: {
        width: '100%',
        backgroundColor: BANK.surface,
        borderRadius: 16,
        padding: SPACING.lg,
        ...SHADOWS.md,
    },
    title: {
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
        color: BANK.text,
        marginBottom: SPACING.xs,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: FONT_SIZE.sm,
        color: BANK.textMuted,
        lineHeight: 18,
        textAlign: 'center',
        marginBottom: SPACING.md,
    },
    details: {
        backgroundColor: BANK.background,
        borderRadius: 10,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: BANK.border,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    detailLabel: {
        fontSize: FONT_SIZE.sm,
        color: BANK.textMuted,
    },
    detailValue: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: BANK.text,
    },
    amountValue: {
        color: BANK.primary,
        fontWeight: 'bold',
    },
    btnRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginTop: SPACING.md,
    },
    btn: {
        flex: 1,
        paddingVertical: SPACING.sm + 4,
        borderRadius: 10,
        alignItems: 'center',
    },
    btnCancel: {
        borderWidth: 1,
        borderColor: BANK.border,
        backgroundColor: BANK.surface,
    },
    btnCancelText: {
        fontSize: FONT_SIZE.md,
        color: BANK.textMuted,
        fontWeight: '600',
    },
    btnConfirm: {
        backgroundColor: BANK.primary,
    },
    btnConfirmText: {
        fontSize: FONT_SIZE.md,
        color: BANK.onPrimary,
        fontWeight: '600',
    },
});
