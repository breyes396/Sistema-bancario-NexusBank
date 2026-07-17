import React from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
} from 'react-native';
import Input from '../../../shared/components/common/Input';
import { securityModal as styles } from '../screens/TransferScreen.styles';

const SecurityConfirmModal = ({
    visible,
    onClose,
    onConfirm,
    sourceAccount,
    destinationNumber,
    recipientType,
    amount,
    currency,
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
                                {currency && currency !== 'GTQ' ? currency : 'Q'}{' '}
                                {parseFloat(amount || 0).toFixed(2)}
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

export default SecurityConfirmModal;
