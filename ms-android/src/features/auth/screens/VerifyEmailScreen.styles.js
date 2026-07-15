import { StyleSheet } from 'react-native';
import { SPACING, FONT_SIZE } from '../../../shared/constants/theme';
import { BANK_DARK as BANK } from '../../../shared/constants/colors';

export default StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: BANK.background,
    },
    keyboardView: {
        flex: 1,
    },
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: SPACING.lg,
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
    infoCard: {
        backgroundColor: BANK.surface,
        borderColor: BANK.accentLight,
        marginBottom: SPACING.md,
    },
    infoText: {
        fontSize: FONT_SIZE.xs,
        color: BANK.primary,
        lineHeight: 18,
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
    successCard: {
        backgroundColor: BANK.surface,
        borderColor: BANK.success,
        marginBottom: SPACING.md,
    },
    successCardText: {
        color: BANK.success,
        fontSize: FONT_SIZE.sm,
        textAlign: 'center',
    },
    resendBtn: {
        marginTop: SPACING.sm,
    },
    switchLink: {
        marginTop: SPACING.lg,
        alignItems: 'center',
    },
    switchText: {
        fontSize: FONT_SIZE.sm,
        color: BANK.textMuted,
    },
    switchTextBold: {
        color: BANK.accent,
        fontWeight: '700',
    },
    successContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.xl,
    },
    successIconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: BANK.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.lg,
        borderWidth: 2,
        borderColor: BANK.accent,
    },
    successIcon: {
        fontSize: 36,
        color: BANK.onPrimary,
        fontWeight: 'bold',
    },
    successTitle: {
        fontSize: FONT_SIZE.xl,
        fontWeight: 'bold',
        color: BANK.text,
        marginBottom: SPACING.sm,
    },
    successMessage: {
        fontSize: FONT_SIZE.md,
        color: BANK.textMuted,
        textAlign: 'center',
        marginBottom: SPACING.xl,
        lineHeight: 22,
    },
});
