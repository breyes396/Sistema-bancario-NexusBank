import React, { useState } from 'react';
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
import { LoadingSpinner, EmptyState, Card } from '../../../shared/components/common/Common';
import styles, { modal } from './DepositScreen.styles';

const DepositScreen = ({ navigation }) => {
    const { accounts, accountsLoading, loading, error, submitDeposit } = useDeposit();

    const [selectedAccount, setSelectedAccount] = useState(null);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [pickerVisible, setPickerVisible] = useState(false);

    const [errors, setErrors] = useState({});

    const validate = () => {
        const newErrors = {};
        if (!selectedAccount) {
            newErrors.account = 'Debes seleccionar una cuenta destino';
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

    const handleSubmit = async () => {
        if (!validate()) return;
        try {
            const result = await submitDeposit({
                destinationAccountNumber: selectedAccount.accountNumber,
                amount,
                description,
            });
            navigation.replace('DepositSuccess', { deposit: result, amount, account: selectedAccount });
        } catch {
            // error already set in hook
        }
    };

    if (accountsLoading) return <LoadingSpinner />;

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
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <Text style={styles.backText}>← Volver</Text>
                        </TouchableOpacity>
                        <Text style={styles.title}>Depósitos</Text>
                        <Text style={styles.subtitle}>
                            Solicita un depósito a tu cuenta. La solicitud queda pendiente de aprobación.
                        </Text>
                    </View>

                    {/* Account Picker */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Cuenta destino</Text>
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
