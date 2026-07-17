import { StyleSheet } from 'react-native';
import { SPACING, FONT_SIZE, SHADOWS } from '../../../shared/constants/theme';
import { BANK_DARK as BANK } from '../../../shared/constants/colors';

export default StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: BANK.background,
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
    },
    requestBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
        borderWidth: 1.5,
        borderColor: BANK.primary,
        borderStyle: 'dashed',
        borderRadius: 10,
        paddingVertical: SPACING.sm + 2,
        marginTop: SPACING.md,
    },
    requestBtnText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: BANK.primary,
    },
    list: {
        padding: SPACING.lg,
        paddingBottom: SPACING.xxl,
    },
    card: {
        borderRadius: 22,
        padding: SPACING.xl,
        marginBottom: SPACING.lg,
        ...SHADOWS.md,
        minHeight: 190,
        position: 'relative',
        overflow: 'hidden',
    },
    cardDecorCircleLg: {
        position: 'absolute',
        top: -60,
        right: -40,
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    cardDecorCircleSm: {
        position: 'absolute',
        bottom: -30,
        right: 40,
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(255,255,255,0.05)',
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
    cardChip: {
        width: 38,
        height: 28,
        backgroundColor: BANK.accent,
        borderRadius: 6,
        marginTop: SPACING.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.35)',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
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
        marginTop: SPACING.md,
        marginBottom: SPACING.lg,
        gap: SPACING.sm,
    },
    cardNumber: {
        flex: 1,
        color: '#ffffff',
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    copyBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardFooter: {
        marginBottom: 2,
    },
    balanceLabel: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    balanceValue: {
        color: '#ffffff',
        fontSize: FONT_SIZE.xxl,
        fontWeight: 'bold',
        marginTop: 2,
    },
    tapTipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        gap: 4,
        marginTop: SPACING.sm,
    },
    tapTip: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: FONT_SIZE.xs,
        fontWeight: '500',
    },
});
