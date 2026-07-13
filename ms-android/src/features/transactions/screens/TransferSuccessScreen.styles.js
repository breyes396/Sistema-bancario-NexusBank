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
        alignItems: 'center',
    },
    iconWrap: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.success,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SPACING.xl,
        marginBottom: SPACING.lg,
        ...SHADOWS.md,
    },
    icon: {
        color: '#fff',
        fontSize: 36,
        fontWeight: 'bold',
    },
    title: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.sm,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textLight,
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
        color: COLORS.text,
        marginBottom: SPACING.md,
        textAlign: 'center',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    rowLabel: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textLight,
        flex: 1,
    },
    rowValue: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text,
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
    },
    amountValue: {
        color: COLORS.primary,
        fontSize: FONT_SIZE.md,
        fontWeight: 'bold',
    },
    statusValue: {
        color: COLORS.success,
        fontWeight: 'bold',
    },
    noteCard: {
        width: '100%',
        backgroundColor: '#f0fdf4',
        borderColor: '#bbf7d0',
        marginBottom: SPACING.xl,
    },
    noteText: {
        fontSize: FONT_SIZE.xs,
        color: '#166534',
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
