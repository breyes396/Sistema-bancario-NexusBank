import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    TouchableOpacity,
    FlatList,
} from 'react-native';
import { EmptyState } from '../../../shared/components/common/Common';
import { getFavoriteAccountTypeLabel, filterFavoritesBySearch } from '../utils/favoriteHelpers';
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from '../../../shared/constants/theme';

// Acceso rápido a favoritos dentro del formulario de Transferencias: mismo
// look & feel que AccountPickerModal, con buscador por alias o número de cuenta.
const FavoritePickerModal = ({ visible, onClose, favorites, onSelectFavorite }) => {
    const [search, setSearch] = useState('');
    const visibleFavorites = filterFavoritesBySearch(favorites, search);

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Elegir de favoritos</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.close}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchWrap}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar por alias o cuenta..."
                            placeholderTextColor={COLORS.textLight}
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>

                    {visibleFavorites.length === 0 ? (
                        <EmptyState message="No tienes cuentas favoritas registradas" />
                    ) : (
                        <FlatList
                            data={visibleFavorites}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.item}
                                    onPress={() => onSelectFavorite(item)}
                                    activeOpacity={0.75}
                                >
                                    <Text style={styles.itemAlias}>{item.alias}</Text>
                                    <Text style={styles.itemSub}>
                                        {item.accountNumber} · {getFavoriteAccountTypeLabel(item.accountType)}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
        paddingBottom: SPACING.xl,
        ...SHADOWS.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    title: {
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    close: {
        fontSize: FONT_SIZE.lg,
        color: COLORS.textLight,
        paddingHorizontal: SPACING.sm,
    },
    searchWrap: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
    },
    searchInput: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        fontSize: FONT_SIZE.sm,
        color: COLORS.text,
        backgroundColor: COLORS.background,
    },
    item: {
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    itemAlias: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
        fontWeight: '600',
    },
    itemSub: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textLight,
        marginTop: 2,
    },
});

export default FavoritePickerModal;
