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
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.lg,
    },
    greeting: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    subtitle: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textLight,
        marginTop: SPACING.xs,
    },
    logoutBtn: {
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.sm,
    },
    logoutText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.error,
        fontWeight: '600',
    },
    welcomeCard: {
        marginBottom: SPACING.xl,
    },
    welcomeLabel: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textLight,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    welcomeValue: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
        fontWeight: '600',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.md,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: SPACING.xl,
    },
    actionCard: {
        width: '48%',
        backgroundColor: COLORS.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingVertical: SPACING.lg,
        alignItems: 'center',
        marginBottom: SPACING.sm,
        ...SHADOWS.sm,
    },
    actionIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.sm,
    },
    actionIcon: {
        fontSize: FONT_SIZE.xl,
        color: COLORS.primary,
    },
    actionLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.text,
    },
    historyRow: {
        marginBottom: SPACING.md,
    },
    historyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    historyText: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
        fontWeight: '500',
    },
    historyArrow: {
        fontSize: FONT_SIZE.xl,
        color: COLORS.textLight,
    },
});
