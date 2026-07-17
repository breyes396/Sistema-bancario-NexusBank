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
    },
    header: {
        marginBottom: SPACING.lg,
    },
    backBtn: {
        marginBottom: SPACING.md,
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
        lineHeight: 20,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    avatarWrap: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: BANK.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: BANK.accent,
        overflow: 'hidden',
        ...SHADOWS.md,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        color: BANK.onPrimary,
        fontSize: FONT_SIZE.xxl,
        fontWeight: 'bold',
    },
    avatarOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(5,15,34,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: BANK.accent,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: BANK.background,
    },
    avatarHint: {
        fontSize: FONT_SIZE.xs,
        color: BANK.textMuted,
        marginTop: SPACING.sm,
    },
    infoCard: {
        marginBottom: SPACING.md,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.xs,
    },
    infoLabel: {
        fontSize: FONT_SIZE.sm,
        color: BANK.textMuted,
    },
    infoValue: {
        fontSize: FONT_SIZE.sm,
        color: BANK.text,
        fontWeight: '600',
    },
    infoValueAccent: {
        fontSize: FONT_SIZE.sm,
        color: BANK.success,
        fontWeight: '700',
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
    inputDisabled: {
        backgroundColor: BANK.background,
        color: BANK.textMuted,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SPACING.md,
        marginBottom: SPACING.md,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: BANK.border,
    },
    switchLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: BANK.text,
    },
    switchHint: {
        fontSize: FONT_SIZE.xs,
        color: BANK.textMuted,
        marginTop: 2,
    },
    saveBtn: {
        marginTop: SPACING.sm,
    },
});
