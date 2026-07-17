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
        width: 92,
        height: 92,
        borderRadius: 46,
        backgroundColor: '#000000',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md,
        overflow: 'hidden',
    },
    logoImage: {
        width: '100%',
        height: '100%',
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
    forgotLink: {
        alignSelf: 'flex-end',
        marginBottom: SPACING.md,
    },
    forgotLinkText: {
        fontSize: FONT_SIZE.xs,
        color: BANK.accent,
        fontWeight: '600',
    },
    resendBtn: {
        marginBottom: SPACING.sm,
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
