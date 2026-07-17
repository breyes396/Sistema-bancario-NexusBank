import { StyleSheet } from 'react-native';
import { SPACING, FONT_SIZE, SHADOWS } from '../../constants/theme';
import { BANK_DARK as BANK } from '../../constants/colors';

export default StyleSheet.create({
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
        alignItems: 'center',
        ...SHADOWS.md,
    },
    iconWrap: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: BANK.success + '22',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md,
    },
    iconWrapError: {
        backgroundColor: BANK.error + '22',
    },
    title: {
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
        color: BANK.text,
        marginBottom: SPACING.xs,
        textAlign: 'center',
    },
    message: {
        fontSize: FONT_SIZE.sm,
        color: BANK.textMuted,
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: SPACING.lg,
    },
    btn: {
        width: '100%',
        paddingVertical: SPACING.sm + 4,
        borderRadius: 10,
        alignItems: 'center',
        backgroundColor: BANK.primary,
    },
    btnText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: BANK.onPrimary,
    },
});
