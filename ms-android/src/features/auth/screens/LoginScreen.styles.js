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
    brand: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    logoCircle: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: BANK.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md,
        borderWidth: 2,
        borderColor: BANK.accent,
    },
    logoText: {
        color: BANK.onPrimary,
        fontSize: FONT_SIZE.xl,
        fontWeight: 'bold',
    },
    brandTitle: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: 'bold',
        color: BANK.text,
    },
    brandSubtitle: {
        fontSize: FONT_SIZE.sm,
        color: BANK.textMuted,
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
});
