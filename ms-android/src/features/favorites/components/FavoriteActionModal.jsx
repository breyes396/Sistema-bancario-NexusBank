import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SPACING, FONT_SIZE, SHADOWS } from '../../../shared/constants/theme';
import { BANK_DARK as BANK } from '../../../shared/constants/colors';
import { StyleSheet } from 'react-native';

// Elegir qué tipo de transacción hacer con un favorito: modal centrado, mismo
// look & feel que SecurityConfirmModal, con dos accesos directos.
const FavoriteActionModal = ({ visible, favorite, onClose, onSelectTransfer, onSelectDeposit }) => {
    if (!favorite) return null;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Transacciones</Text>
                            <Text style={styles.subtitle}>
                                {favorite.alias} · {favorite.accountNumber}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.close}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.body}>
                        <TouchableOpacity
                            style={styles.option}
                            onPress={() => onSelectTransfer(favorite)}
                            activeOpacity={0.75}
                        >
                            <View style={[styles.iconWrap, { backgroundColor: BANK.primary + '22' }]}>
                                <Feather name="send" size={20} color={BANK.primary} />
                            </View>
                            <View style={styles.optionTextWrap}>
                                <Text style={styles.optionTitle}>Transferencia</Text>
                                <Text style={styles.optionSubtitle}>Envía dinero a esta cuenta al instante</Text>
                            </View>
                            <Feather name="chevron-right" size={18} color={BANK.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.option}
                            onPress={() => onSelectDeposit(favorite)}
                            activeOpacity={0.75}
                        >
                            <View style={[styles.iconWrap, { backgroundColor: BANK.accent + '22' }]}>
                                <Feather name="download" size={20} color={BANK.accent} />
                            </View>
                            <View style={styles.optionTextWrap}>
                                <Text style={styles.optionTitle}>Depósito</Text>
                                <Text style={styles.optionSubtitle}>Solicita un depósito a esta cuenta</Text>
                            </View>
                            <Feather name="chevron-right" size={18} color={BANK.textMuted} />
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
        backgroundColor: 'rgba(5,15,34,0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    sheet: {
        width: '100%',
        backgroundColor: BANK.surface,
        borderRadius: 20,
        ...SHADOWS.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: BANK.border,
    },
    title: {
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
        color: BANK.text,
    },
    subtitle: {
        fontSize: FONT_SIZE.xs,
        color: BANK.textMuted,
        marginTop: 2,
    },
    close: {
        fontSize: FONT_SIZE.lg,
        color: BANK.textMuted,
        paddingHorizontal: SPACING.sm,
    },
    body: {
        padding: SPACING.lg,
        paddingBottom: SPACING.xl,
        gap: SPACING.sm,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        padding: SPACING.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: BANK.border,
        backgroundColor: BANK.background,
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionTextWrap: {
        flex: 1,
    },
    optionTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: BANK.text,
    },
    optionSubtitle: {
        fontSize: FONT_SIZE.xs,
        color: BANK.textMuted,
        marginTop: 2,
    },
});

export default FavoriteActionModal;
