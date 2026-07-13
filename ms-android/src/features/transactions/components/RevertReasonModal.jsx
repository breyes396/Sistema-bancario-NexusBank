import React from 'react';
import {
    View,
    Text,
    Modal,
    TextInput,
    TouchableOpacity,
} from 'react-native';
import { COLORS } from '../../../shared/constants/theme';
import { revertModal as styles } from '../screens/TransactionsScreen.styles';

const RevertReasonModal = ({
    visible,
    onClose,
    onConfirm,
    reason,
    setReason,
    transactionId,
}) => {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                    <Text style={styles.modalTitle}>Solicitar Reversión</Text>
                    <Text style={styles.modalSubtitle}>
                        Por favor ingresa el motivo o justificación del contracargo para la transacción ID: {transactionId}
                    </Text>
                    
                    <TextInput
                        style={styles.modalInput}
                        placeholder="Motivo de reversión..."
                        placeholderTextColor={COLORS.textLight}
                        value={reason}
                        onChangeText={setReason}
                        multiline
                        numberOfLines={3}
                    />

                    <View style={styles.modalBtnRow}>
                        <TouchableOpacity
                            style={[styles.modalBtn, styles.modalBtnCancel]}
                            onPress={onClose}
                        >
                            <Text style={styles.modalBtnCancelText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalBtn, styles.modalBtnConfirm]}
                            onPress={onConfirm}
                        >
                            <Text style={styles.modalBtnConfirmText}>Enviar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default RevertReasonModal;
