import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, SPACING } from '../../constants/theme';

const Input = ({ label, error, ...props }) => {
    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholderTextColor={COLORS.textLight}
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
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        paddingVertical: SPACING.sm + 2,
        paddingHorizontal: SPACING.md,
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
        backgroundColor: COLORS.surface,
    },
    inputError: {
        borderColor: COLORS.error,
    },
    error: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.error,
        marginTop: SPACING.xs,
    },
});

export default Input;
