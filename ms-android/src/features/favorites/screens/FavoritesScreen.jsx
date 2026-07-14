import React, { useMemo, useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    RefreshControl,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFavorites } from '../hooks/useFavorites';
import FavoriteCard from '../components/FavoriteCard';
import FavoriteFormModal from '../components/FavoriteFormModal';
import FavoriteActionModal from '../components/FavoriteActionModal';
import { LoadingSpinner, EmptyState } from '../../../shared/components/common/Common';
import HeaderMenuButton from '../../../shared/components/common/HeaderMenuButton';
import BottomNavBar from '../../../shared/components/common/BottomNavBar';
import { filterFavoritesBySearch } from '../utils/favoriteHelpers';
import { BANK_DARK as BANK } from '../../../shared/constants/colors';
import styles from './FavoritesScreen.styles';

const FavoritesScreen = ({ navigation }) => {
    const {
        favorites,
        loading,
        mutating,
        error,
        refetch,
        createFavorite,
        updateFavorite,
        deleteFavorite,
    } = useFavorites();

    const [search, setSearch] = useState('');
    const [formVisible, setFormVisible] = useState(false);
    const [editingFavorite, setEditingFavorite] = useState(null);
    const [actionsVisible, setActionsVisible] = useState(false);
    const [actionsFavorite, setActionsFavorite] = useState(null);

    const visibleFavorites = useMemo(
        () => filterFavoritesBySearch(favorites, search),
        [favorites, search]
    );

    const handleRefresh = useCallback(() => refetch(), [refetch]);

    const handleAdd = () => {
        setEditingFavorite(null);
        setFormVisible(true);
    };

    const handleEdit = (favorite) => {
        setEditingFavorite(favorite);
        setFormVisible(true);
    };

    const handleFormSubmit = async (form) => {
        if (editingFavorite) {
            await updateFavorite(editingFavorite.id, form);
        } else {
            await createFavorite(form);
        }
        setFormVisible(false);
    };

    const handleDelete = (favorite) => {
        Alert.alert(
            'Eliminar favorito',
            `¿Deseas eliminar "${favorite.alias}" de tus cuentas favoritas?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: () => deleteFavorite(favorite.id),
                },
            ]
        );
    };

    const handleOpenActions = (favorite) => {
        setActionsFavorite(favorite);
        setActionsVisible(true);
    };

    const handleCloseActions = () => {
        setActionsVisible(false);
        setActionsFavorite(null);
    };

    const handleSelectTransfer = (favorite) => {
        handleCloseActions();
        navigation.navigate('Transfer', {
            prefillDestinationAccountNumber: favorite.accountNumber,
            prefillRecipientType: 'TERCERO',
            prefillDescription: `Transferencia a favorito: ${favorite.alias}`,
        });
    };

    const handleSelectDeposit = (favorite) => {
        handleCloseActions();
        navigation.navigate('Deposit', {
            prefillDestinationAccountNumber: favorite.accountNumber,
            prefillDescription: `Depósito a favorito: ${favorite.alias}`,
        });
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <HeaderMenuButton navigation={navigation} style={styles.backBtn} />
                <Text style={styles.title}>Favoritos</Text>
                <Text style={styles.subtitle}>
                    Guarda cuentas de uso recurrente y ejecuta transferencias rápidas.
                </Text>
            </View>

            <View style={styles.toolbar}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar por alias o cuenta..."
                    placeholderTextColor={BANK.textMuted}
                    value={search}
                    onChangeText={setSearch}
                />
                <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.8}>
                    <Feather name="plus" size={18} color={BANK.primary} />
                    <Text style={styles.addBtnText}>Agregar favorito</Text>
                </TouchableOpacity>
            </View>

            {error ? (
                <View style={styles.errorCard}>
                    <Text style={styles.errorCardText}>{error}</Text>
                </View>
            ) : null}

            {loading && favorites.length === 0 ? (
                <LoadingSpinner />
            ) : (
                <FlatList
                    data={visibleFavorites}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <FavoriteCard
                            item={item}
                            onTransactions={handleOpenActions}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={handleRefresh} colors={[BANK.primary]} />
                    }
                    ListEmptyComponent={<EmptyState message="No hay favoritos registrados." />}
                />
            )}

            <FavoriteFormModal
                visible={formVisible}
                onClose={() => setFormVisible(false)}
                onSubmit={handleFormSubmit}
                submitting={mutating}
                editingFavorite={editingFavorite}
            />

            <FavoriteActionModal
                visible={actionsVisible}
                favorite={actionsFavorite}
                onClose={handleCloseActions}
                onSelectTransfer={handleSelectTransfer}
                onSelectDeposit={handleSelectDeposit}
            />

            <BottomNavBar navigation={navigation} />
        </SafeAreaView>
    );
};

export default FavoritesScreen;
