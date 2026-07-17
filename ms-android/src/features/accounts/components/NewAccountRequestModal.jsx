import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import Input from '../../../shared/components/common/Input';
import Button from '../../../shared/components/common/Button';
import { SPACING, FONT_SIZE, SHADOWS } from '../../../shared/constants/theme';
import { BANK_DARK as BANK } from '../../../shared/constants/colors';

// Mismas opciones que expone el modal de la web (Accounts.jsx / NewAccountRequestModal.jsx):
// aunque el backend también acepta "nomina", la web solo ofrece ahorro/corriente.
const ACCOUNT_TYPE_OPTIONS = [
    { value: 'ahorro', label: 'Cuenta de Ahorros' },
    { value: 'corriente', label: 'Cuenta Corriente' },
];

const NewAccountRequestModal = ({ visible, onClose, onSubmit, submitting }) => {
    const [accountType, setAccountType] = useState('ahorro');
    const [note, setNote] = useState('');
    const [formError, setFormError] = useState(null);

    useEffect(() => {
        if (visible) {
            setAccountType('ahorro');
            setNote('');
            setFormError(null);
        }
    }, [visible]);

    const handleSubmit = async () => {
        if (!note.trim()) {
            setFormError('Cuéntale al administrador por qué necesitas esta cuenta');
            return;
        }
        setFormError(null);
        try {
            await onSubmit({ accountType, note });
        } catch (err) {
            setFormError(err.message);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Solicitar cuenta</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.close}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.body}>
                        <Text style={styles.label}>Tipo de cuenta</Text>
                        <View style={styles.toggleRow}>
                            {ACCOUNT_TYPE_OPTIONS.map((opt) => (
                                <TouchableOpacity
                                    key={opt.value}
                                    style={[
                                        styles.toggleBtn,
                                        accountType === opt.value && styles.toggleBtnActive,
                                    ]}
                                    onPress={() => setAccountType(opt.value)}
                                >
                                    <Text
                                        style={[
                                            styles.toggleBtnText,
                                            accountType === opt.value && styles.toggleBtnTextActive,
                                        ]}
                                    >
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Input
                            label="Motivo de la solicitud"
                            placeholder="Ej. Necesito una cuenta para ahorrar aparte"
                            value={note}
                            onChangeText={setNote}
                            maxLength={200}
                            multiline
                        />

                        <Text style={styles.hint}>
                            Tu solicitud quedará pendiente hasta que un administrador la apruebe.
                        </Text>

                        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

                        <Button
                            title="Enviar solicitud"
                            onPress={handleSubmit}
                            loading={submitting}
                            disabled={submitting}
                        />
                    </View>
                </View>
            </KeyboardAvoidingView>
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
        alignItems: 'center',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: BANK.border,
    },
    title: {
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
        color: BANK.text,
    },
    close: {
        fontSize: FONT_SIZE.lg,
        color: BANK.textMuted,
        paddingHorizontal: SPACING.sm,
    },
    body: {
        padding: SPACING.lg,
        paddingBottom: SPACING.xl,
    },
    label: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: BANK.text,
        marginBottom: SPACING.xs,
    },
    toggleRow: {
        flexDirection: 'row',
        backgroundColor: BANK.border,
        borderRadius: 10,
        padding: 4,
        marginBottom: SPACING.md,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: SPACING.sm + 2,
        alignItems: 'center',
        borderRadius: 8,
    },
    toggleBtnActive: {
        backgroundColor: BANK.surface,
        ...SHADOWS.sm,
    },
    toggleBtnText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: BANK.textMuted,
    },
    toggleBtnTextActive: {
        color: BANK.primary,
    },
    hint: {
        fontSize: FONT_SIZE.xs,
        color: BANK.textMuted,
        marginBottom: SPACING.md,
        lineHeight: 16,
    },
    errorText: {
        fontSize: FONT_SIZE.xs,
        color: BANK.error,
        marginBottom: SPACING.md,
        textAlign: 'center',
    },
});

export default NewAccountRequestModal;
