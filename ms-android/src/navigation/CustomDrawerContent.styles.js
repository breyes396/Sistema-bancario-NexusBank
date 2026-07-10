import { StyleSheet } from 'react-native';
import { DARK, SPACING, FONT_SIZE } from '../shared/constants/theme';

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
