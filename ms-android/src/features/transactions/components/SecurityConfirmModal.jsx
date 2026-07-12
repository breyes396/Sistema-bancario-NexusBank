import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
} from 'react-native';
import Input from '../../../shared/components/common/Input';
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from '../../../shared/constants/theme';

const SecurityConfirmModal = ({
    visible,
    onClose,
    onConfirm,
    sourceAccount,
    destinationNumber,
    recipientType,
    amount,
    description,
    confirmPassword,
    setConfirmPassword,
    error,
}) => {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <Text style={styles.title}>Confirmación de seguridad</Text>
                    <Text style={styles.subtitle}>
                        Por seguridad, confirma los datos de la transferencia ingresando tu contraseña.
                    </Text>
                    
                    <View style={styles.details}>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Origen:</Text>
                            <Text style={styles.detailValue}>{sourceAccount?.accountNumber}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Destino:</Text>
                            <Text style={styles.detailValue}>{destinationNumber}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Monto:</Text>
                            <Text style={[styles.detailValue, styles.amountValue]}>
                                Q{parseFloat(amount || 0).toFixed(2)}
                            </Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Concepto:</Text>
                            <Text style={styles.detailValue}>{description || 'Sin concepto'}</Text>
                        </View>
                    </View>

                    <Input
                        placeholder="Contraseña"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        error={error}
                    />

                    <View style={styles.btnRow}>
                        <TouchableOpacity
                            style={[styles.btn, styles.btnCancel]}
                            onPress={onClose}
                        >
                            <Text style={styles.btnCancelText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.btn, styles.btnConfirm]}
                            onPress={onConfirm}
                        >
                            <Text style={styles.btnConfirmText}>Confirmar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    card: {
        width: '100%',
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: SPACING.lg,
        ...SHADOWS.md,
    },
    title: {
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.xs,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textLight,
        lineHeight: 18,
        textAlign: 'center',
        marginBottom: SPACING.md,
    },
    details: {
        backgroundColor: COLORS.background,
        borderRadius: 10,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    detailLabel: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textLight,
    },
    detailValue: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.text,
    },
    amountValue: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    btnRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginTop: SPACING.md,
    },
    btn: {
        flex: 1,
        paddingVertical: SPACING.sm + 4,
        borderRadius: 10,
        alignItems: 'center',
    },
    btnCancel: {
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    btnCancelText: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textLight,
        fontWeight: '600',
    },
    btnConfirm: {
        backgroundColor: COLORS.primary,
    },
    btnConfirmText: {
        fontSize: FONT_SIZE.md,
        color: '#fff',
        fontWeight: '600',
    },
});

export default SecurityConfirmModal;
