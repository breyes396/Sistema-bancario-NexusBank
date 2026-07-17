import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Feather } from '@expo/vector-icons';
import {
    getPromotionTypeLabel,
    getPromotionBenefitText,
    getPromotionInstructions,
    formatPromotionDate,
} from '../utils/promotionHelpers';
import { BANK_DARK as BANK } from '../../../shared/constants/colors';
import styles from '../screens/PromotionsScreen.styles';

// Paridad con Promotions.jsx (web): "usar promoción" no abre nada externo,
// copia el _id como código de promoción y muestra instrucciones estáticas
// por promotionType. El backend de catalog no expone ni imagen ni URL de
// términos, así que este modal interno concentra toda la info disponible.
const PromotionDetailModal = ({ visible, onClose, promotion }) => {
    const [copied, setCopied] = useState(false);

    if (!promotion) return null;

    const handleCopyCode = async () => {
        await Clipboard.setStringAsync(promotion.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={styles.sheetHeader}>
                        <Text style={styles.sheetTitle} numberOfLines={2}>{promotion.name}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.close}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.sheetBody}>
                        <View style={styles.typeBadge}>
                            <Text style={styles.typeBadgeText}>{getPromotionTypeLabel(promotion.promotionType)}</Text>
                        </View>

                        <Text style={styles.sectionLabel}>Detalle del beneficio</Text>
                        <Text style={styles.sectionText}>{getPromotionBenefitText(promotion)}</Text>

                        <Text style={styles.sectionLabel}>Descripción</Text>
                        <Text style={styles.sectionText}>
                            {promotion.description || 'Sin descripción disponible.'}
                        </Text>

                        <Text style={styles.sectionLabel}>Vigencia</Text>
                        <Text style={styles.sectionText}>
                            Del {formatPromotionDate(promotion.startDate)} al {formatPromotionDate(promotion.endDate)}
                        </Text>

                        <Text style={styles.sectionLabel}>Cómo usarla / Condiciones</Text>
                        <Text style={styles.sectionText}>{getPromotionInstructions(promotion.promotionType)}</Text>

                        <Text style={styles.sectionLabel}>Código de promoción</Text>
                        <View style={styles.codeRow}>
                            <Text style={styles.codeText}>{promotion.id}</Text>
                            <TouchableOpacity style={styles.copyBtn} onPress={handleCopyCode} activeOpacity={0.7}>
                                <Feather
                                    name={copied ? 'check' : 'copy'}
                                    size={14}
                                    color={BANK.accent}
                                />
                                <Text style={styles.copyBtnText}>{copied ? 'Copiado' : 'Copiar'}</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

export default PromotionDetailModal;
