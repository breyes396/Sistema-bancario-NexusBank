import { StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZE } from '../../../shared/constants/theme';

export default StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: COLORS.background,
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
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.sm,
    },
    logoText: {
        color: '#fff',
        fontSize: FONT_SIZE.xl,
        fontWeight: 'bold',
    },
    brandTitle: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    brandSubtitle: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textLight,
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
    switchLink: {
        marginTop: SPACING.lg,
        alignItems: 'center',
    },
    switchText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textLight,
    },
    switchTextBold: {
        color: COLORS.primary,
        fontWeight: '700',
    },
});
