import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTransfer } from '../hooks/useTransfer';
import Button from '../../../shared/components/common/Button';
import Input from '../../../shared/components/common/Input';
import { LoadingSpinner, Card } from '../../../shared/components/common/Common';
import AccountPickerModal from '../components/AccountPickerModal';
import SecurityConfirmModal from '../components/SecurityConfirmModal';
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from '../../../shared/constants/theme';

const TransferScreen = ({ navigation }) => {
    const { accounts, accountsLoading, loading, error, submitTransfer } = useTransfer();

    const [selectedSource, setSelectedSource] = useState(null);
    const [recipientType, setRecipientType] = useState('TERCERO'); // 'PROPIA' or 'TERCERO'
    const [selectedDestination, setSelectedDestination] = useState(null); // Used if 'PROPIA'
    const [destinationAccountNum, setDestinationAccountNum] = useState(''); // Used if 'TERCERO'
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    
    // UI state
    const [pickerSourceVisible, setPickerSourceVisible] = useState(false);
    const [pickerDestVisible, setPickerDestVisible] = useState(false);
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

                    {/* Recipient Type Selector */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Destinatario</Text>
                        <View style={styles.toggleRow}>
                            <TouchableOpacity
                                style={[
                                    styles.toggleBtn,
                                    recipientType === 'TERCERO' && styles.toggleBtnActive,
                                ]}
                                onPress={() => {
                                    setRecipientType('TERCERO');
                                    setErrors((prev) => ({ ...prev, destination: null }));
                                }}
                            >
                                <Text
                                    style={[
                                        styles.toggleBtnText,
                                        recipientType === 'TERCERO' && styles.toggleBtnTextActive,
                                    ]}
                                >
                                    Tercero
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.toggleBtn,
                                    recipientType === 'PROPIA' && styles.toggleBtnActive,
                                ]}
                                onPress={() => {
                                    setRecipientType('PROPIA');
                                    setErrors((prev) => ({ ...prev, destination: null }));
                                }}
                            >
                                <Text
                                    style={[
                                        styles.toggleBtnText,
                                        recipientType === 'PROPIA' && styles.toggleBtnTextActive,
                                    ]}
                                >
                                    Cuenta Propia
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Destination Account Input / Picker */}
                    <View style={styles.section}>
                        <Text style={styles.label}>Cuenta destino</Text>
                        {recipientType === 'PROPIA' ? (
                            <TouchableOpacity
                                style={[styles.picker, errors.destination && styles.pickerError]}
                                onPress={() => setPickerDestVisible(true)}
                                activeOpacity={0.8}
                            >
                                {selectedDestination ? (
                                    <View>
                                        <Text style={styles.pickerValue}>
                                            {selectedDestination.accountNumber}
                                        </Text>
                                        <Text style={styles.pickerSub}>
                                            {selectedDestination.accountType} · Q{parseFloat(selectedDestination.accountBalance || 0).toFixed(2)}
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
                                onChangeText={(val) => {
                                    setDestinationAccountNum(val.replace(/[^0-9-]/g, ''));
                                    if (errors.destination) {
                                        setErrors((prev) => ({ ...prev, destination: null }));
                                    }
                                }}
                                keyboardType="default"
                                error={errors.destination}
                            />
                        )}
                        {recipientType === 'PROPIA' && errors.destination ? (
                            <Text style={styles.errorText}>{errors.destination}</Text>
                        ) : null}
                    </View>

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

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    container: {
        padding: SPACING.lg,
        paddingBottom: SPACING.xxl,
    },
    header: {
        marginBottom: SPACING.xl,
    },
    backBtn: {
        marginBottom: SPACING.md,
    },
    backText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.primary,
        fontWeight: '600',
    },
    title: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    subtitle: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textLight,
        lineHeight: 20,
    },
    section: {
        marginBottom: SPACING.md,
    },
    label: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    picker: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        paddingVertical: SPACING.sm + 2,
        paddingHorizontal: SPACING.md,
        backgroundColor: COLORS.surface,
    },
    pickerError: {
        borderColor: COLORS.error,
    },
    pickerValue: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
        fontWeight: '500',
    },
    pickerSub: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textLight,
        marginTop: 2,
    },
    pickerPlaceholder: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textLight,
    },
    pickerArrow: {
        fontSize: 12,
        color: COLORS.textLight,
    },
    toggleRow: {
        flexDirection: 'row',
        backgroundColor: COLORS.border,
        borderRadius: 10,
        padding: 4,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: SPACING.sm + 2,
        alignItems: 'center',
        borderRadius: 8,
    },
    toggleBtnActive: {
        backgroundColor: COLORS.surface,
        ...SHADOWS.sm,
    },
    toggleBtnText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.textLight,
    },
    toggleBtnTextActive: {
        color: COLORS.primary,
    },
    errorText: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.error,
        marginTop: SPACING.xs,
    },
    errorCard: {
        backgroundColor: '#fef2f2',
        borderColor: COLORS.error,
        marginBottom: SPACING.md,
    },
    errorCardText: {
        color: COLORS.error,
        fontSize: FONT_SIZE.sm,
        textAlign: 'center',
    },
});

export default TransferScreen;
