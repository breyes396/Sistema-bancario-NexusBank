import { StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from '../../../shared/constants/theme';

export default StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        padding: SPACING.lg,
        paddingBottom: SPACING.sm,
    },
    backBtn: {
        marginBottom: SPACING.sm,
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
    },
    list: {
        padding: SPACING.lg,
        paddingBottom: SPACING.xxl,
    },
    card: {
        borderRadius: 16,
        padding: SPACING.xl,
        marginBottom: SPACING.lg,
        ...SHADOWS.md,
        minHeight: 180,
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    bankName: {
        color: '#ffffff',
        fontSize: FONT_SIZE.md,
        fontWeight: '800',
        letterSpacing: 1,
    },
    cardType: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: FONT_SIZE.xs,
        marginTop: 2,
    },
    chipLogoContainer: {
        alignItems: 'flex-end',
    },
    cardChip: {
        width: 35,
        height: 25,
        backgroundColor: '#ecc94b',
        borderRadius: 4,
        marginBottom: SPACING.xs,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 20,
    },
    statusActive: {
        backgroundColor: 'rgba(72, 187, 120, 0.25)',
    },
    statusBlocked: {
        backgroundColor: 'rgba(245, 101, 101, 0.25)',
    },
    statusReview: {
        backgroundColor: 'rgba(237, 137, 54, 0.25)',
    },
    statusBadgeText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    cardNumberContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: SPACING.md,
    },
    cardNumber: {
        color: '#ffffff',
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    copyBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
    },
    copyBtnText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: '600',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    balanceLabel: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    balanceValue: {
        color: '#ffffff',
        fontSize: FONT_SIZE.xl,
        fontWeight: 'bold',
        marginTop: 2,
    },
    tapTip: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: FONT_SIZE.xs,
        fontWeight: '500',
    },
});
