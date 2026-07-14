import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { FONT_SIZE, SPACING } from '../../constants/theme';
import { BANK_DARK as BANK } from '../../constants/colors';

const Button = ({ title, onPress, loading = false, variant = 'primary', disabled = false, style }) => {
    const isDisabled = disabled || loading;

    return (
        <TouchableOpacity
            style={[
                styles.base,
                variant === 'primary' ? styles.primary : styles.secondary,
                isDisabled && styles.disabled,
                style,
            ]}
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'primary' ? BANK.onPrimary : BANK.primary}
                    size="small"
                />
            ) : (
                <Text style={[styles.text, variant === 'secondary' && styles.textSecondary]}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        paddingVertical: SPACING.sm + 4,
        paddingHorizontal: SPACING.lg,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    primary: {
        backgroundColor: BANK.primary,
    },
    secondary: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: BANK.primary,
    },
    disabled: {
        opacity: 0.6,
    },
    text: {
        color: BANK.onPrimary,
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
    },
    textSecondary: {
        color: BANK.primary,
    },
});

export default Button;
