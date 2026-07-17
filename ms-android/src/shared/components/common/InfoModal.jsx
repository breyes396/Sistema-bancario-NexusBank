import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BANK_DARK as BANK } from '../../constants/colors';
import styles from './InfoModal.styles';

// Reemplazo temático de Alert.alert() para mensajes de éxito/error de una sola
// acción (OK), siguiendo el mismo look & feel que LogoutConfirmModal.
const InfoModal = ({ visible, type = 'success', title, message, onClose }) => {
    const isError = type === 'error';
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={[styles.iconWrap, isError && styles.iconWrapError]}>
                        <Feather
                            name={isError ? 'alert-circle' : 'check-circle'}
                            size={26}
                            color={isError ? BANK.error : BANK.success}
                        />
                    </View>
                    <Text style={styles.title}>{title}</Text>
                    {message ? <Text style={styles.message}>{message}</Text> : null}
                    <TouchableOpacity style={styles.btn} onPress={onClose} activeOpacity={0.8}>
                        <Text style={styles.btnText}>Entendido</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export default InfoModal;
