import { StyleSheet } from 'react-native';
import { SPACING } from '../../constants/theme';
import { BANK_DARK as DARK } from '../../constants/colors';

export default StyleSheet.create({
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingTop: SPACING.sm,
        backgroundColor: DARK.surface,
        borderTopWidth: 1,
        borderTopColor: DARK.border,
    },
    navItem: {
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: SPACING.sm,
    },
    navLabel: {
        fontSize: 11,
        fontWeight: '400',
        color: DARK.textMuted,
    },
    navLabelActive: {
        fontWeight: '500',
        color: DARK.accent,
    },
});
