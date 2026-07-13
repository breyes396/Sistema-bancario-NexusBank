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
import { ACCOUNT_TYPE_OPTIONS, validateFavoriteForm } from '../utils/favoriteHelpers';
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from '../../../shared/constants/theme';

const emptyForm = { accountNumber: '', accountType: 'ahorro', alias: '' };

// Mismo formulario para agregar y editar: en edición, accountNumber queda
// solo lectura porque el backend no permite reasignarlo (ver useFavorites.updateFavorite).
const FavoriteFormModal = ({ visible, onClose, onSubmit, submitting, editingFavorite }) => {
    const [form, setForm] = useState(emptyForm);
    const [formError, setFormError] = useState(null);

    useEffect(() => {
        if (visible) {
            setForm(editingFavorite ? {
                accountNumber: editingFavorite.accountNumber,
                accountType: editingFavorite.accountType,
                alias: editingFavorite.alias,
            } : emptyForm);
            setFormError(null);
        }
    }, [visible, editingFavorite]);

    const handleSubmit = async () => {
        const validationError = validateFavoriteForm(form);
        if (validationError) {
            setFormError(validationError);
            return;
        }
        try {
            await onSubmit(form);
        } catch (err) {
            setFormError(err.message);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Text style={styles.title}>
                            {editingFavorite ? 'Editar favorito' : 'Agregar favorito'}
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.close}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.body}>
                        <Input
                            label="Número de cuenta"
                            placeholder="Ej. 001-9115890794-1"
                            value={form.accountNumber}
                            editable={!editingFavorite}
                            onChangeText={(val) => setForm((prev) => ({ ...prev, accountNumber: val }))}
                            style={editingFavorite ? styles.inputDisabled : undefined}
                        />

                        <Text style={styles.label}>Tipo de cuenta</Text>
                        <View style={styles.toggleRow}>
                            {ACCOUNT_TYPE_OPTIONS.map((opt) => (
                                <TouchableOpacity
                                    key={opt.value}
                                    style={[
                                        styles.toggleBtn,
                                        form.accountType === opt.value && styles.toggleBtnActive,
                                    ]}
                                    onPress={() => setForm((prev) => ({ ...prev, accountType: opt.value }))}
                                >
                                    <Text
                                        style={[
                                            styles.toggleBtnText,
                                            form.accountType === opt.value && styles.toggleBtnTextActive,
                                        ]}
                                    >
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Input
                            label="Alias"
                            placeholder="Ej. Mamá"
                            value={form.alias}
                            maxLength={50}
                            onChangeText={(val) => setForm((prev) => ({ ...prev, alias: val }))}
                        />

                        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

                        <Button
                            title={editingFavorite ? 'Guardar cambios' : 'Agregar favorito'}
                            onPress={handleSubmit}
                            loading={submitting}
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
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
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
    body: {
        padding: SPACING.lg,
        paddingBottom: SPACING.xl,
    },
    inputDisabled: {
        backgroundColor: COLORS.background,
        color: COLORS.textLight,
    },
    label: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    toggleRow: {
        flexDirection: 'row',
        backgroundColor: COLORS.border,
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
        marginBottom: SPACING.md,
        textAlign: 'center',
    },
});

export default FavoriteFormModal;
