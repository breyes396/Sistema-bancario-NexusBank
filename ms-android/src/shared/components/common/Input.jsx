import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { FONT_SIZE, SPACING } from '../../constants/theme';
import { BANK_DARK as BANK } from '../../constants/colors';

const Input = ({ label, error, ...props }) => {
    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholderTextColor={BANK.textMuted}
                {...props}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.md,
    },
    label: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: BANK.text,
        marginBottom: SPACING.xs,
    },
    input: {
        borderWidth: 1,
        borderColor: BANK.border,
        borderRadius: 10,
        paddingVertical: SPACING.sm + 2,
        paddingHorizontal: SPACING.md,
        fontSize: FONT_SIZE.md,
        color: BANK.text,
        backgroundColor: BANK.surface,
    },
    inputError: {
        borderColor: BANK.error,
    },
    error: {
        fontSize: FONT_SIZE.xs,
        color: BANK.error,
        marginTop: SPACING.xs,
    },
});

export default Input;
