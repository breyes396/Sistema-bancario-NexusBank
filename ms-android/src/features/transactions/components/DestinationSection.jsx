import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Input from '../../../shared/components/common/Input';
import { COLORS } from '../../../shared/constants/theme';
import styles from '../screens/TransferScreen.styles';

const RECIPIENT_TYPES = [
    { value: 'TERCERO', label: 'Tercero' },
    { value: 'PROPIA', label: 'Cuenta Propia' },
];

// Selector de destinatario + cuenta destino de TransferScreen: se extrajo
// aparte para mantener la pantalla dentro del límite de ~400 líneas del proyecto.
const DestinationSection = ({
    recipientType,
    onChangeRecipientType,
    selectedDestination,
    onOpenAccountPicker,
    destinationAccountNum,
    onChangeDestinationNumber,
    hasFavorites,
    onOpenFavoritePicker,
    error,
}) => (
    <>
        <View style={styles.section}>
            <Text style={styles.label}>Destinatario</Text>
            <View style={styles.toggleRow}>
                {RECIPIENT_TYPES.map((type) => (
                    <TouchableOpacity
                        key={type.value}
                        style={[styles.toggleBtn, recipientType === type.value && styles.toggleBtnActive]}
                        onPress={() => onChangeRecipientType(type.value)}
                    >
                        <Text
                            style={[
                                styles.toggleBtnText,
                                recipientType === type.value && styles.toggleBtnTextActive,
                            ]}
                        >
                            {type.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>

        <View style={styles.section}>
            <View style={styles.labelRow}>
                <Text style={styles.label}>Cuenta destino</Text>
                {recipientType === 'TERCERO' && hasFavorites ? (
                    <TouchableOpacity
                        style={styles.favoritesShortcut}
                        onPress={onOpenFavoritePicker}
                        activeOpacity={0.7}
                    >
                        <Feather name="star" size={14} color={COLORS.primary} />
                        <Text style={styles.favoritesShortcutText}>Favoritos</Text>
                    </TouchableOpacity>
                ) : null}
            </View>

            {recipientType === 'PROPIA' ? (
                <TouchableOpacity
                    style={[styles.picker, error && styles.pickerError]}
                    onPress={onOpenAccountPicker}
                    activeOpacity={0.8}
                >
                    {selectedDestination ? (
                        <View>
                            <Text style={styles.pickerValue}>{selectedDestination.accountNumber}</Text>
                            <Text style={styles.pickerSub}>
                                {selectedDestination.accountType} · Q
                                {parseFloat(selectedDestination.accountBalance || 0).toFixed(2)}
                            </Text>
                        </View>
                    ) : (
                        <Text style={styles.pickerPlaceholder}>Selecciona una de tus cuentas</Text>
                    )}
                    <Text style={styles.pickerArrow}>▼</Text>
                </TouchableOpacity>
            ) : (
                <Input
                    placeholder="Ingresa el número de cuenta de destino"
                    value={destinationAccountNum}
                    onChangeText={onChangeDestinationNumber}
                    keyboardType="default"
                    error={error}
                />
            )}

            {recipientType === 'PROPIA' && error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
    </>
);

export default DestinationSection;
