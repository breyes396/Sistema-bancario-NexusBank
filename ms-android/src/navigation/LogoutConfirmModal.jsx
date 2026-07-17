import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BANK_DARK as DARK } from '../shared/constants/colors';
import { logoutModal as styles } from './CustomDrawerContent.styles';

const LogoutConfirmModal = ({ visible, onCancel, onConfirm }) => (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
        <View style={styles.overlay}>
            <View style={styles.card}>
                <View style={styles.iconWrap}>
                    <Feather name="log-out" size={22} color={DARK.danger} />
                </View>
                <Text style={styles.title}>Cerrar sesión</Text>
                <Text style={styles.message}>
                    ¿Estás seguro de que deseas salir de tu cuenta de NexusBank?
                </Text>
                <View style={styles.btnRow}>
                    <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={onCancel} activeOpacity={0.75}>
                        <Text style={styles.btnCancelText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, styles.btnConfirm]} onPress={onConfirm} activeOpacity={0.75}>
                        <Text style={styles.btnConfirmText}>Sí, salir</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    </Modal>
);

export default LogoutConfirmModal;
