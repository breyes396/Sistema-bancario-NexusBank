import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    Modal,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDeposit } from '../hooks/useDeposit';
import Button from '../../../shared/components/common/Button';
import Input from '../../../shared/components/common/Input';
import { EmptyState, Card } from '../../../shared/components/common/Common';
import HeaderMenuButton from '../../../shared/components/common/HeaderMenuButton';
import BottomNavBar from '../../../shared/components/common/BottomNavBar';
import styles, { modal } from './DepositScreen.styles';

const RECIPIENT_TYPES = [
    { value: 'PROPIA', label: 'Mis Cuentas' },
    { value: 'TERCERO', label: 'Otra Cuenta' },
];

const DepositScreen = ({ navigation, route }) => {
    const { accounts, loading, error, submitDeposit } = useDeposit();

    const [recipientType, setRecipientType] = useState('PROPIA');
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [manualAccountNumber, setManualAccountNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [pickerVisible, setPickerVisible] = useState(false);

    const [errors, setErrors] = useState({});

    // Prellenado al llegar desde "Transacciones" de un favorito, igual que el
    // patrón ya usado en TransferScreen.
    useEffect(() => {
        const prefill = route?.params;
        if (!prefill?.prefillDestinationAccountNumber) return;

        setRecipientType('TERCERO');
        setManualAccountNumber(prefill.prefillDestinationAccountNumber);
        if (prefill.prefillDescription) setDescription(prefill.prefillDescription);

        navigation.setParams({
            prefillDestinationAccountNumber: undefined,
            prefillDescription: undefined,
        });
    }, [route?.params]);

    const validate = () => {
        const newErrors = {};
        if (recipientType === 'PROPIA') {
            if (!selectedAccount) {
                newErrors.account = 'Debes seleccionar una cuenta destino';
            }
        } else if (!manualAccountNumber || manualAccountNumber.trim() === '') {
            newErrors.account = 'El número de cuenta destino es requerido';
        }
        if (!amount || amount.trim() === '') {
            newErrors.amount = 'El monto es requerido';
        } else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            newErrors.amount = 'El monto debe ser mayor a Q0.00';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAmountChange = (text) => {
        // Allow only numbers and one decimal point
        const cleaned = text.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
        setAmount(cleaned);
        if (errors.amount) {
            setErrors((prev) => ({ ...prev, amount: null }));
        }
    };

    const handleSelectAccount = (account) => {
        setSelectedAccount(account);
        setPickerVisible(false);
        if (errors.account) {
            setErrors((prev) => ({ ...prev, account: null }));
        }
    };

    const handleChangeRecipientType = (type) => {
        setRecipientType(type);
        if (errors.account) {
            setErrors((prev) => ({ ...prev, account: null }));
        }
    };

    const handleManualAccountChange = (text) => {
        setManualAccountNumber(text.replace(/[^0-9-]/g, ''));
        if (errors.account) {
            setErrors((prev) => ({ ...prev, account: null }));
        }
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        const destinationAccountNumber = recipientType === 'PROPIA'
            ? selectedAccount.accountNumber
            : manualAccountNumber;
        try {
            const result = await submitDeposit({
                destinationAccountNumber,
                amount,
                description,
            });
            const account = recipientType === 'PROPIA'
                ? selectedAccount
                : { accountNumber: manualAccountNumber };
            navigation.replace('DepositSuccess', { deposit: result, amount, account });
        } catch {
            // error already set in hook
        }
    };

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
                        <Text style={styles.title}>Depósitos</Text>
                        <Text style={styles.subtitle}>
                            Solicita un depósito a tu cuenta. La solicitud queda pendiente de aprobación.
                        </Text>
                    </View>

                    {/* Recipient Type Toggle */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Cuenta destino</Text>
                        <View style={styles.toggleRow}>
                            {RECIPIENT_TYPES.map((type) => (
                                <TouchableOpacity
                                    key={type.value}
                                    style={[styles.toggleBtn, recipientType === type.value && styles.toggleBtnActive]}
                                    onPress={() => handleChangeRecipientType(type.value)}
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

                    {/* Account Picker or Manual Entry */}
                    <View style={styles.section}>
                        {recipientType === 'PROPIA' ? (
                            <TouchableOpacity
                                style={[styles.picker, errors.account && styles.pickerError]}
                                onPress={() => setPickerVisible(true)}
                                activeOpacity={0.8}
                            >
                                {selectedAccount ? (
                                    <View>
                                        <Text style={styles.pickerValue}>
                                            {selectedAccount.accountNumber}
                                        </Text>
                                        <Text style={styles.pickerSub}>
                                            {selectedAccount.accountType} · Q{parseFloat(selectedAccount.accountBalance || 0).toFixed(2)}
                                        </Text>
                                    </View>
                                ) : (
                                    <Text style={styles.pickerPlaceholder}>Selecciona una cuenta</Text>
                                )}
                                <Text style={styles.pickerArrow}>▼</Text>
                            </TouchableOpacity>
                        ) : (
                            <Input
                                placeholder="Ingresa el número de cuenta de destino"
                                value={manualAccountNumber}
                                onChangeText={handleManualAccountChange}
                                keyboardType="default"
                            />
                        )}
                        {errors.account ? (
                            <Text style={styles.errorText}>{errors.account}</Text>
                        ) : null}
                    </View>

                    {/* Amount */}
                    <Input
                        label="Monto (Q)"
                        placeholder="0.00"
                        value={amount}
                        onChangeText={handleAmountChange}
                        keyboardType="decimal-pad"
                        error={errors.amount}
                    />

                    {/* Description */}
                    <Input
                        label="Descripción (opcional)"
                        placeholder="Ej. Depósito por ventanilla"
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

                    {/* Info card */}
                    <Card style={styles.infoCard}>
                        <Text style={styles.infoText}>
                            Las solicitudes de depósito quedan en estado{' '}
                            <Text style={styles.infoBold}>PENDIENTE</Text> hasta ser aprobadas por un
                            empleado o administrador de NexusBank.
                        </Text>
                    </Card>

                    <Button
                        title="Solicitar Depósito"
                        onPress={handleSubmit}
                        loading={loading}
                        disabled={loading}
                    />
                </ScrollView>
            </KeyboardAvoidingView>

            <BottomNavBar navigation={navigation} />

            {/* Account Picker Modal */}
            <Modal visible={pickerVisible} transparent animationType="slide">
                <View style={modal.overlay}>
                    <View style={modal.sheet}>
                        <View style={modal.header}>
                            <Text style={modal.title}>Selecciona una cuenta</Text>
                            <TouchableOpacity onPress={() => setPickerVisible(false)}>
                                <Text style={modal.close}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        {accounts.length === 0 ? (
                            <EmptyState message="No tienes cuentas activas disponibles" />
                        ) : (
                            <FlatList
                                data={accounts}
                                keyExtractor={(item) => item.id?.toString() || item.accountNumber}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            modal.item,
                                            selectedAccount?.accountNumber === item.accountNumber &&
                                                modal.itemSelected,
                                        ]}
                                        onPress={() => handleSelectAccount(item)}
                                        activeOpacity={0.75}
                                    >
                                        <Text style={modal.itemNumber}>{item.accountNumber}</Text>
                                        <Text style={modal.itemSub}>
                                            {item.accountType} · Q{parseFloat(item.accountBalance || 0).toFixed(2)}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default DepositScreen;
