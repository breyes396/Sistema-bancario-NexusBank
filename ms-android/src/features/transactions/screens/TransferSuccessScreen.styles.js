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
        alignItems: 'center',
    },
    iconWrap: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: BANK.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SPACING.xl,
        marginBottom: SPACING.lg,
        borderWidth: 2,
        borderColor: BANK.accent,
        ...SHADOWS.md,
    },
    icon: {
        color: BANK.onPrimary,
        fontSize: 36,
        fontWeight: 'bold',
    },
    title: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: 'bold',
        color: BANK.text,
        marginBottom: SPACING.sm,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: FONT_SIZE.sm,
        color: BANK.textMuted,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: SPACING.xl,
        paddingHorizontal: SPACING.md,
    },
    card: {
        width: '100%',
        marginBottom: SPACING.md,
    },
    cardTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: 'bold',
        color: BANK.text,
        marginBottom: SPACING.md,
        textAlign: 'center',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: BANK.border,
    },
    rowLabel: {
        fontSize: FONT_SIZE.sm,
        color: BANK.textMuted,
        flex: 1,
    },
    rowValue: {
        fontSize: FONT_SIZE.sm,
        color: BANK.text,
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
    },
    amountValue: {
        color: BANK.primary,
        fontSize: FONT_SIZE.md,
        fontWeight: 'bold',
    },
    statusValue: {
        color: BANK.success,
        fontWeight: 'bold',
    },
    noteCard: {
        width: '100%',
        backgroundColor: BANK.accentLight + '33',
        borderColor: BANK.accentLight,
        marginBottom: SPACING.xl,
    },
    noteText: {
        fontSize: FONT_SIZE.xs,
        color: BANK.primaryDark,
        lineHeight: 18,
        textAlign: 'center',
    },
    btnPrimary: {
        marginBottom: SPACING.sm,
    },
    btnSecondary: {
        marginBottom: SPACING.sm,
    },
});
