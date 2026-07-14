import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SPACING, SHADOWS, FONT_SIZE } from '../../constants/theme';
import { BANK_DARK as BANK } from '../../constants/colors';

export const LoadingSpinner = () => (
    <View style={spinner.container}>
        <ActivityIndicator size="large" color={BANK.primary} />
    </View>
);

export const EmptyState = ({ message = 'No hay datos disponibles' }) => (
    <View style={empty.container}>
        <Text style={empty.text}>{message}</Text>
    </View>
);

export const Card = ({ children, style }) => (
    <View style={[card.container, style]}>
        {children}
    </View>
);

const spinner = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

const empty = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    text: {
        fontSize: FONT_SIZE.md,
        color: BANK.textMuted,
        textAlign: 'center',
    },
});

const card = StyleSheet.create({
    container: {
        backgroundColor: BANK.surface,
        borderRadius: 12,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: BANK.border,
        ...SHADOWS.sm,
    },
});
