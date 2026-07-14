import { StyleSheet } from 'react-native';
import { SPACING, FONT_SIZE } from '../shared/constants/theme';
import { BANK_DARK as DARK } from '../shared/constants/colors';

export default StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: DARK.background,
    },
    header: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.lg,
        paddingBottom: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: DARK.border,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: DARK.income,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.sm,
    },
    avatarText: {
        color: DARK.text,
        fontSize: FONT_SIZE.xl,
        fontWeight: '500',
    },
    userName: {
        color: DARK.text,
        fontSize: FONT_SIZE.lg,
        fontWeight: '500',
    },
    userSubtitle: {
        color: DARK.textMuted,
        fontSize: FONT_SIZE.sm,
        marginTop: 2,
    },
    menuList: {
        flex: 1,
        paddingTop: SPACING.md,
        paddingHorizontal: SPACING.sm,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        paddingVertical: SPACING.sm + 4,
        paddingHorizontal: SPACING.md,
        borderRadius: 12,
        marginBottom: 2,
    },
    menuItemActive: {
        backgroundColor: DARK.accent,
    },
    menuLabel: {
        color: DARK.textMuted,
        fontSize: FONT_SIZE.md,
        fontWeight: '400',
    },
    menuLabelActive: {
        color: DARK.text,
        fontWeight: '500',
    },
    footer: {
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.md,
    },
    separator: {
        height: 1,
        backgroundColor: DARK.border,
        marginBottom: SPACING.sm,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        paddingVertical: SPACING.sm + 4,
        paddingHorizontal: SPACING.md,
        borderRadius: 12,
    },
    logoutText: {
        color: DARK.danger,
        fontSize: FONT_SIZE.md,
        fontWeight: '500',
    },
});

// ── LogoutConfirmModal ───────────────────────────────────────────────────────
export const logoutModal = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(5,15,34,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    card: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: DARK.surface,
        borderRadius: 16,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: DARK.border,
    },
    iconWrap: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: DARK.danger + '22',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md,
    },
    title: {
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
        color: DARK.text,
        marginBottom: SPACING.xs,
    },
    message: {
        fontSize: FONT_SIZE.sm,
        color: DARK.textMuted,
        lineHeight: 20,
        marginBottom: SPACING.lg,
    },
    btnRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    btn: {
        flex: 1,
        paddingVertical: SPACING.sm + 4,
        borderRadius: 10,
        alignItems: 'center',
    },
    btnCancel: {
        borderWidth: 1,
        borderColor: DARK.border,
        backgroundColor: 'transparent',
    },
    btnCancelText: {
        fontSize: FONT_SIZE.md,
        color: DARK.textMuted,
        fontWeight: '600',
    },
    btnConfirm: {
        backgroundColor: DARK.danger,
    },
    btnConfirmText: {
        fontSize: FONT_SIZE.md,
        color: DARK.text,
        fontWeight: '600',
    },
});
