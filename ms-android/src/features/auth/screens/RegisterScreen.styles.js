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
        padding: SPACING.lg,
        paddingBottom: SPACING.xxl,
    },
    header: {
        marginBottom: SPACING.lg,
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
    infoCard: {
        backgroundColor: '#eff6ff',
        borderColor: '#bfdbfe',
        marginBottom: SPACING.md,
    },
    infoText: {
        fontSize: FONT_SIZE.xs,
        color: '#1e40af',
        lineHeight: 18,
    },
    infoBold: {
        fontWeight: 'bold',
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
        backgroundColor: '#dcfce7',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.lg,
    },
    successIcon: {
        fontSize: 36,
        color: COLORS.success,
        fontWeight: 'bold',
    },
    successTitle: {
        fontSize: FONT_SIZE.xl,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    successMessage: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textLight,
        textAlign: 'center',
        marginBottom: SPACING.xl,
        lineHeight: 22,
    },
});
