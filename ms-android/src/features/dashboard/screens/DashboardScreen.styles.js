import { StyleSheet } from 'react-native';
import { SPACING, FONT_SIZE } from '../../../shared/constants/theme';
import { BANK_DARK as DARK } from '../../../shared/constants/colors';

export default StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: DARK.background,
    },
    container: {
        padding: SPACING.lg,
        paddingBottom: 110,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.lg,
    },
    iconBtn: {
        padding: SPACING.xs,
    },
    brand: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '500',
        color: DARK.text,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    notifDot: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: DARK.expense,
        borderWidth: 1,
        borderColor: DARK.background,
    },
    avatarSmall: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: DARK.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarSmallText: {
        color: DARK.text,
        fontSize: FONT_SIZE.sm,
        fontWeight: '500',
    },

    // Saludo
    greeting: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: '500',
        color: DARK.text,
    },
    subtitle: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '400',
        color: DARK.textMuted,
        marginTop: 2,
        marginBottom: SPACING.lg,
    },

    // Tarjeta de saldo
    balanceCard: {
        backgroundColor: DARK.balanceCard,
        borderRadius: 16,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
    },
    balanceHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    balanceLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '400',
        color: 'rgba(255,255,255,0.75)',
    },
    balanceAmount: {
        fontSize: FONT_SIZE.huge,
        fontWeight: 'bold',
        color: DARK.text,
        marginTop: SPACING.sm,
    },
    balanceUpdated: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '400',
        color: 'rgba(255,255,255,0.6)',
        marginTop: SPACING.sm,
    },

    // Ingresos / Gastos
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.lg,
    },
    miniCard: {
        width: '48%',
        backgroundColor: DARK.card,
        borderRadius: 16,
        padding: SPACING.md,
    },
    miniCardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: SPACING.sm,
    },
    miniCardLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '400',
        color: DARK.textMuted,
    },
    miniCardAmount: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '500',
    },

    // Secciones
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '500',
        color: DARK.text,
    },
    sectionLink: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '400',
        color: DARK.accent,
    },

    // Favoritos
    favoritesRow: {
        marginBottom: SPACING.lg,
    },
    favoritesContent: {
        gap: SPACING.md,
        paddingRight: SPACING.md,
    },
    addFavoriteBtn: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 1.5,
        borderColor: DARK.textFaint,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyFavoritesHint: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '400',
        color: DARK.textFaint,
        marginLeft: SPACING.sm,
        alignSelf: 'center',
    },
    favoriteChip: {
        alignItems: 'center',
        width: 64,
    },
    favoriteChipAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: DARK.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    favoriteChipAvatarText: {
        color: DARK.accent,
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
    },
    favoriteChipLabel: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '400',
        color: DARK.textMuted,
        marginTop: 6,
        textAlign: 'center',
    },

    // Movimientos
    emptyText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '400',
        color: DARK.textMuted,
        marginBottom: SPACING.lg,
    },
    movementRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    movementIconWrap: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.sm,
    },
    movementInfo: {
        flex: 1,
        marginRight: SPACING.sm,
    },
    movementDesc: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '500',
        color: DARK.text,
    },
    movementDate: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '400',
        color: DARK.textMuted,
        marginTop: 2,
    },
    movementAmount: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '500',
    },
});
