import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePromotions } from '../hooks/usePromotions';
import PromotionCard from '../components/PromotionCard';
import PromotionDetailModal from '../components/PromotionDetailModal';
import { LoadingSpinner, EmptyState } from '../../../shared/components/common/Common';
import HeaderMenuButton from '../../../shared/components/common/HeaderMenuButton';
import BottomNavBar from '../../../shared/components/common/BottomNavBar';
import { BANK_DARK as BANK } from '../../../shared/constants/colors';
import styles from './PromotionsScreen.styles';

const PromotionsScreen = ({ navigation }) => {
    const { promotions, loading, error, search, setSearch, refetch } = usePromotions();
    const [selectedPromotion, setSelectedPromotion] = useState(null);

    const handleRefresh = useCallback(() => refetch(), [refetch]);

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <HeaderMenuButton navigation={navigation} style={styles.backBtn} />
                <Text style={styles.title}>Promociones Activas</Text>
                <Text style={styles.subtitle}>Descubre los beneficios exclusivos que tenemos para ti.</Text>
            </View>

            <View style={styles.toolbar}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar promociones por nombre..."
                    placeholderTextColor={BANK.textMuted}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {error ? (
                <View style={styles.errorCard}>
                    <Text style={styles.errorCardText}>{error}</Text>
                </View>
            ) : null}

            {loading && promotions.length === 0 ? (
                <LoadingSpinner />
            ) : (
                <FlatList
                    data={promotions}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <PromotionCard item={item} onUse={setSelectedPromotion} />
                    )}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={handleRefresh} colors={[BANK.primary]} />
                    }
                    ListEmptyComponent={
                        <EmptyState message="No hay promociones activas en este momento." />
                    }
                />
            )}

            <PromotionDetailModal
                visible={!!selectedPromotion}
                onClose={() => setSelectedPromotion(null)}
                promotion={selectedPromotion}
            />

            <BottomNavBar navigation={navigation} />
        </SafeAreaView>
    );
};

export default PromotionsScreen;
