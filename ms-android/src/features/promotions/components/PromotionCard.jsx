import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Card } from '../../../shared/components/common/Common';
import {
    getPromotionTypeLabel,
    getPromotionBenefitText,
    formatPromotionDate,
} from '../utils/promotionHelpers';
import { COLORS } from '../../../shared/constants/theme';
import styles from '../screens/PromotionsScreen.styles';

const PromotionCard = ({ item, onUse }) => (
    <Card style={styles.card}>
        <View style={styles.cardBanner} />
        <View style={styles.cardBody}>
            <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{getPromotionTypeLabel(item.promotionType)}</Text>
            </View>

            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.description} numberOfLines={3}>
                {item.description || 'Sin descripción disponible.'}
            </Text>

            <View style={styles.benefitRow}>
                <Feather name="gift" size={16} color={COLORS.primary} />
                <Text style={styles.benefitText}>{getPromotionBenefitText(item)}</Text>
            </View>

            <Text style={styles.validityText}>
                Vigencia: {formatPromotionDate(item.startDate)} — {formatPromotionDate(item.endDate)}
            </Text>

            <TouchableOpacity style={styles.useBtn} onPress={() => onUse(item)} activeOpacity={0.8}>
                <Feather name="info" size={16} color="#fff" />
                <Text style={styles.useBtnText}>Ver detalle y usar</Text>
            </TouchableOpacity>
        </View>
    </Card>
);

export default PromotionCard;
