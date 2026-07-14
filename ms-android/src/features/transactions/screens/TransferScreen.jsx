import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTransfer } from '../hooks/useTransfer';
import { useFavorites } from '../../favorites/hooks/useFavorites';
import Button from '../../../shared/components/common/Button';
import Input from '../../../shared/components/common/Input';
import { Card } from '../../../shared/components/common/Common';
import HeaderMenuButton from '../../../shared/components/common/HeaderMenuButton';
import BottomNavBar from '../../../shared/components/common/BottomNavBar';
import AccountPickerModal from '../components/AccountPickerModal';
import SecurityConfirmModal from '../components/SecurityConfirmModal';
import DestinationSection from '../components/DestinationSection';
import FavoritePickerModal from '../../favorites/components/FavoritePickerModal';
import { SPACING } from '../../../shared/constants/theme';
import styles from './TransferScreen.styles';

const TransferScreen = ({ navigation, route }) => {
    const { accounts, loading, error, submitTransfer } = useTransfer();
    const { favorites } = useFavorites();

    const [selectedSource, setSelectedSource] = useState(null);
    const [recipientType, setRecipientType] = useState('TERCERO'); // 'PROPIA' or 'TERCERO'
    const [selectedDestination, setSelectedDestination] = useState(null); // Used if 'PROPIA'
    const [destinationAccountNum, setDestinationAccountNum] = useState(''); // Used if 'TERCERO'
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');

    // UI state
    const [pickerSourceVisible, setPickerSourceVisible] = useState(false);
    const [pickerDestVisible, setPickerDestVisible] = useState(false);
    const [favoritePickerVisible, setFavoritePickerVisible] = useState(false);
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');

    // Errors
    const [errors, setErrors] = useState({});
    const [localBalanceError, setLocalBalanceError] = useState('');

    // Pre-select first account as default source
    useEffect(() => {
        if (accounts.length > 0 && !selectedSource) {
            setSelectedSource(accounts[0]);
        }
    }, [accounts, selectedSource]);

    // Prellenado al llegar desde "Transferir" de un favorito (Favoritos o el
    // dashboard), igual que el patrón location.state del frontend web.
    useEffect(() => {
        const prefill = route?.params;
        if (!prefill?.prefillDestinationAccountNumber) return;

        setRecipientType(prefill.prefillRecipientType || 'TERCERO');
        setDestinationAccountNum(prefill.prefillDestinationAccountNumber);
        if (prefill.prefillDescription) setDescription(prefill.prefillDescription);

        navigation.setParams({
            prefillDestinationAccountNumber: undefined,
            prefillRecipientType: undefined,
            prefillDescription: undefined,
        });
    }, [route?.params]);

    // Recalculate balance validation when source or amount changes
    useEffect(() => {
        validateBalance(amount, selectedSource);
    }, [amount, selectedSource]);

    const validateBalance = (amtVal, srcAcc) => {
        if (!srcAcc) {
            setLocalBalanceError('');
            return;
        }
        if (!amtVal || amtVal.trim() === '') {
            setLocalBalanceError('');
            return;
        }
        const numericAmount = parseFloat(amtVal);
        const balance = parseFloat(srcAcc.accountBalance || 0);
        
        if (isNaN(numericAmount) || numericAmount <= 0) {
            setLocalBalanceError('Monto inválido');
        } else if (numericAmount > balance) {
            setLocalBalanceError(`Saldo insuficiente. Disponible: Q${balance.toFixed(2)}`);
        } else {
            setLocalBalanceError('');
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!selectedSource) {
            newErrors.source = 'Debes seleccionar una cuenta de origen';
        }
        if (recipientType === 'PROPIA') {
            if (!selectedDestination) {
                newErrors.destination = 'Debes seleccionar una cuenta de destino';
            } else if (selectedSource && selectedSource.accountNumber === selectedDestination.accountNumber) {
                newErrors.destination = 'La cuenta destino debe ser diferente a la de origen';
            }
        } else {
            if (!destinationAccountNum || destinationAccountNum.trim() === '') {
                newErrors.destination = 'El número de cuenta destino es requerido';
            }
        }
        if (!amount || amount.trim() === '') {
            newErrors.amount = 'El monto es requerido';
        } else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            newErrors.amount = 'El monto debe ser mayor a Q0.00';
        } else if (localBalanceError) {
            newErrors.amount = 'Corrige el error de saldo antes de continuar';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAmountChange = (text) => {
        const cleaned = text.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
        setAmount(cleaned);
        if (errors.amount) {
            setErrors((prev) => ({ ...prev, amount: null }));
        }
    };

    const handleSelectSource = (account) => {
        setSelectedSource(account);
        setPickerSourceVisible(false);
        if (errors.source) {
            setErrors((prev) => ({ ...prev, source: null }));
        }
        // Reset destination if own and matches
        if (selectedDestination?.accountNumber === account.accountNumber) {
            setSelectedDestination(null);
        }
    };

    const handleSelectDestination = (account) => {
        setSelectedDestination(account);
        setPickerDestVisible(false);
        if (errors.destination) {
            setErrors((prev) => ({ ...prev, destination: null }));
        }
    };

    const handleSelectFavorite = (favorite) => {
        setDestinationAccountNum(favorite.accountNumber);
        if (!description) {
            setDescription(`Transferencia a favorito: ${favorite.alias}`);
        }
        setFavoritePickerVisible(false);
        if (errors.destination) {
            setErrors((prev) => ({ ...prev, destination: null }));
        }
    };

    const handleOpenConfirm = () => {
        if (!validateForm()) return;
        setConfirmPassword('');
        setConfirmModalVisible(true);
    };

    const handleConfirmAndProcess = async () => {
        if (!confirmPassword || confirmPassword.trim() === '') {
            setErrors(prev => ({ ...prev, confirmPassword: 'La contraseña es requerida por seguridad' }));
            return;
        }

        setConfirmModalVisible(false);
        
        const destNum = recipientType === 'PROPIA' 
            ? selectedDestination.accountNumber 
            : destinationAccountNum;

        try {
            const result = await submitTransfer({
                sourceAccountNumber: selectedSource.accountNumber,
                destinationAccountNumber: destNum,
                recipientType,
                amount,
                description,
            });
            
            navigation.replace('TransferSuccess', {
                transfer: result,
                amount,
                sourceAccount: selectedSource,
                destinationNumber: destNum,
                recipientType,
                description
            });
        } catch {
            // error is stored in hook and shown below
        }
    };

    // Filter own accounts for destination (exclude selected source)
    const destinationAccountsList = accounts.filter(
        (acc) => !selectedSource || acc.accountNumber !== selectedSource.accountNumber
    );

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <HeaderMenuButton navigation={navigation} style={styles.backBtn} />
                        <Text style={styles.title}>Transferir fondos</Text>
                        <Text style={styles.subtitle}>
                            Envía dinero al instante entre tus cuentas o a cuentas de terceros en NexusBank.
                        </Text>
                    </View>

                    {/* Source Account Picker */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Cuenta origen</Text>
                        <TouchableOpacity
                            style={[styles.picker, errors.source && styles.pickerError]}
                            onPress={() => setPickerSourceVisible(true)}
                            activeOpacity={0.8}
                        >
                            {selectedSource ? (
                                <View>
                                    <Text style={styles.pickerValue}>
                                        {selectedSource.accountNumber}
                                    </Text>
                                    <Text style={styles.pickerSub}>
                                        {selectedSource.accountType} · Q{parseFloat(selectedSource.accountBalance || 0).toFixed(2)}
                                    </Text>
                                </View>
                            ) : (
                                <Text style={styles.pickerPlaceholder}>Selecciona una cuenta</Text>
                            )}
                            <Text style={styles.pickerArrow}>▼</Text>
                        </TouchableOpacity>
                        {errors.source ? (
                            <Text style={styles.errorText}>{errors.source}</Text>
                        ) : null}
                    </View>

                    {/* Recipient Type + Destination Account */}
                    <DestinationSection
                        recipientType={recipientType}
                        onChangeRecipientType={(type) => {
                            setRecipientType(type);
                            setErrors((prev) => ({ ...prev, destination: null }));
                        }}
                        selectedDestination={selectedDestination}
                        onOpenAccountPicker={() => setPickerDestVisible(true)}
                        destinationAccountNum={destinationAccountNum}
                        onChangeDestinationNumber={(val) => {
                            setDestinationAccountNum(val.replace(/[^0-9-]/g, ''));
                            if (errors.destination) {
                                setErrors((prev) => ({ ...prev, destination: null }));
                            }
                        }}
                        hasFavorites={favorites.length > 0}
                        onOpenFavoritePicker={() => setFavoritePickerVisible(true)}
                        error={errors.destination}
                    />

                    {/* Amount */}
                    <View>
                        <Input
                            label="Monto (Q)"
                            placeholder="0.00"
                            value={amount}
                            onChangeText={handleAmountChange}
                            keyboardType="decimal-pad"
                            error={errors.amount || localBalanceError}
                        />
                    </View>

                    {/* Description */}
                    <Input
                        label="Concepto / Descripción"
                        placeholder="Ej. Pago de mensualidad"
                        value={description}
                        onChangeText={setDescription}
                        maxLength={100}
                    />

                    {/* API error */}
                    {error ? (
                        <Card style={styles.errorCard}>
                            <Text style={styles.errorCardText}>{error}</Text>
                        </Card>
                    ) : null}

                    {/* Submit Button */}
                    <Button
                        title="Continuar"
                        onPress={handleOpenConfirm}
                        disabled={loading || !!localBalanceError}
                        style={{ marginTop: SPACING.md }}
                    />
                </ScrollView>
            </KeyboardAvoidingView>

            <BottomNavBar navigation={navigation} />

            {/* Source Account Picker Modal */}
            <AccountPickerModal
                visible={pickerSourceVisible}
                onClose={() => setPickerSourceVisible(false)}
                accounts={accounts}
                selectedAccount={selectedSource}
                onSelectAccount={handleSelectSource}
                title="Selecciona cuenta de origen"
            />

            {/* Destination Account Picker Modal */}
            <AccountPickerModal
                visible={pickerDestVisible}
                onClose={() => setPickerDestVisible(false)}
                accounts={destinationAccountsList}
                selectedAccount={selectedDestination}
                onSelectAccount={handleSelectDestination}
                title="Selecciona cuenta destino propia"
            />

            {/* Favorites Quick Picker */}
            <FavoritePickerModal
                visible={favoritePickerVisible}
                onClose={() => setFavoritePickerVisible(false)}
                favorites={favorites}
                onSelectFavorite={handleSelectFavorite}
            />

            {/* Security Confirmation Modal */}
            <SecurityConfirmModal
                visible={confirmModalVisible}
                onClose={() => setConfirmModalVisible(false)}
                onConfirm={handleConfirmAndProcess}
                sourceAccount={selectedSource}
                destinationNumber={recipientType === 'PROPIA' ? selectedDestination?.accountNumber : destinationAccountNum}
                recipientType={recipientType}
                amount={amount}
                description={description}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                error={errors.confirmPassword}
            />
        </SafeAreaView>
    );
};

export default TransferScreen;
