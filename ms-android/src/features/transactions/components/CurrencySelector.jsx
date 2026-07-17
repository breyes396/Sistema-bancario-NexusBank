import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Input from '../../../shared/components/common/Input';
import { BANK_DARK as BANK } from '../../../shared/constants/colors';
import styles from '../screens/TransferScreen.styles';

// Mismas divisas que el selector de la web (Transfers.jsx): GTQ + opción manual
// de código ISO de 3 letras para cualquier otra.
export const CURRENCY_OPTIONS = ['GTQ', 'USD', 'EUR', 'GBP', 'MXN', 'JPY'];

const CurrencySelector = ({
    currency,
    isManualCurrency,
    customCurrency,
    onSelectCurrency,
    onToggleManual,
    onChangeCustomCurrency,
    convertedAmount,
    convertLoading,
}) => (
    <View style={styles.section}>
        <View style={styles.labelRow}>
            <Text style={styles.label}>Moneda</Text>
            <TouchableOpacity onPress={onToggleManual} activeOpacity={0.7}>
                <Text style={styles.favoritesShortcutText}>
                    {isManualCurrency ? 'Elegir de la lista' : 'Otra moneda'}
                </Text>
            </TouchableOpacity>
        </View>

        {isManualCurrency ? (
            <Input
                placeholder="Ej. CLP"
                value={customCurrency}
                onChangeText={(val) => onChangeCustomCurrency(val.toUpperCase().slice(0, 3))}
                autoCapitalize="characters"
                maxLength={3}
            />
        ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.currencyRow}>
                    {CURRENCY_OPTIONS.map((code) => (
                        <TouchableOpacity
                            key={code}
                            style={[styles.currencyChip, currency === code && styles.currencyChipActive]}
                            onPress={() => onSelectCurrency(code)}
                            activeOpacity={0.75}
                        >
                            <Text
                                style={[
                                    styles.currencyChipText,
                                    currency === code && styles.currencyChipTextActive,
                                ]}
                            >
                                {code}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        )}

        {convertLoading ? (
            <ActivityIndicator size="small" color={BANK.primary} style={styles.currencyPreviewLoader} />
        ) : convertedAmount ? (
            <Text style={styles.currencyPreviewText}>≈ Q{convertedAmount} al tipo de cambio actual</Text>
        ) : null}
    </View>
);

export default CurrencySelector;
