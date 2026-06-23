import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Modal,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
} from 'react-native';
import { useDeposit } from '../hooks/useDeposit';
import Button from '../../../shared/components/common/Button';
import Input from '../../../shared/components/common/Input';
import { LoadingSpinner, EmptyState, Card } from '../../../shared/components/common/Common';
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from '../../../shared/constants/theme';

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
    infoCard: {
        backgroundColor: '#eff6ff',
        borderColor: '#bfdbfe',
        marginBottom: SPACING.lg,
    },
    infoText: {
        fontSize: FONT_SIZE.xs,
        color: '#1e40af',
        lineHeight: 18,
    },
    infoBold: {
        fontWeight: 'bold',
    },
});

const modal = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '60%',
        paddingBottom: SPACING.xl,
        ...SHADOWS.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    title: {
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    close: {
        fontSize: FONT_SIZE.lg,
        color: COLORS.textLight,
        paddingHorizontal: SPACING.sm,
    },
    item: {
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    itemSelected: {
        backgroundColor: '#eff6ff',
    },
    itemNumber: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
        fontWeight: '600',
    },
    itemSub: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textLight,
        marginTop: 2,
    },
});

export default DepositScreen;
