import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    TouchableOpacity,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from '../../../shared/constants/theme';

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

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    modalCard: {
        width: '100%',
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: SPACING.lg,
        ...SHADOWS.md,
    },
    modalTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.xs,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textLight,
        lineHeight: 18,
        textAlign: 'center',
        marginBottom: SPACING.md,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        padding: SPACING.sm,
        fontSize: FONT_SIZE.sm,
        color: COLORS.text,
        backgroundColor: COLORS.background,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: SPACING.md,
    },
    modalBtnRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: SPACING.sm + 4,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalBtnCancel: {
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    modalBtnCancelText: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textLight,
        fontWeight: '600',
    },
    modalBtnConfirm: {
        backgroundColor: COLORS.primary,
    },
    modalBtnConfirmText: {
        fontSize: FONT_SIZE.md,
        color: '#fff',
        fontWeight: '600',
    },
});

export default RevertReasonModal;
