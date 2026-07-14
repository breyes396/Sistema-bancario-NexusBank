import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFavorites } from '../../favorites/hooks/useFavorites';
import { BANK_DARK as DARK } from '../../../shared/constants/colors';
import styles from '../screens/DashboardScreen.styles';

const FavoritesSection = ({ navigation }) => {
    const { favorites, loading } = useFavorites();

    const goToFavorites = () => navigation?.navigate('Secondary', { screen: 'Favorites' });

    const goToTransfer = (favorite) => {
        navigation?.navigate('Secondary', {
            screen: 'Transfer',
            params: {
                prefillDestinationAccountNumber: favorite.accountNumber,
                prefillRecipientType: 'TERCERO',
                prefillDescription: `Transferencia a favorito: ${favorite.alias}`,
            },
        });
    };

    return (
        <>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Favoritos</Text>
                <TouchableOpacity onPress={goToFavorites} activeOpacity={0.7}>
                    <Text style={styles.sectionLink}>Ver todos</Text>
                </TouchableOpacity>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.favoritesRow}
                contentContainerStyle={styles.favoritesContent}
            >
                <TouchableOpacity
                    style={styles.addFavoriteBtn}
                    activeOpacity={0.7}
                    onPress={goToFavorites}
                >
                    <Feather name="plus" size={22} color={DARK.textMuted} />
                </TouchableOpacity>

                {!loading && favorites.length === 0 ? (
                    <Text style={styles.emptyFavoritesHint}>Aún no tienes favoritos</Text>
                ) : (
                    favorites.slice(0, 8).map((favorite) => (
                        <TouchableOpacity
                            key={favorite.id}
                            style={styles.favoriteChip}
                            activeOpacity={0.7}
                            onPress={() => goToTransfer(favorite)}
                        >
                            <View style={styles.favoriteChipAvatar}>
                                <Text style={styles.favoriteChipAvatarText}>
                                    {favorite.alias.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <Text style={styles.favoriteChipLabel} numberOfLines={1}>
                                {favorite.alias}
                            </Text>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </>
    );
};

export default FavoritesSection;
