import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { DARK } from '../../../shared/constants/theme';
import styles from '../screens/DashboardScreen.styles';

const FavoritesSection = () => (
    <>
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Favoritos</Text>
            <TouchableOpacity onPress={() => console.log('Favoritos: Ver todos')} activeOpacity={0.7}>
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
                onPress={() => console.log('Favoritos: agregar')}
            >
                <Feather name="plus" size={22} color={DARK.textMuted} />
            </TouchableOpacity>
            <Text style={styles.emptyFavoritesHint}>Aún no tienes favoritos</Text>
        </ScrollView>
    </>
);

export default FavoritesSection;
