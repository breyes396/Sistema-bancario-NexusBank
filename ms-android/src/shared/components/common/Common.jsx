import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, SPACING, SHADOWS, FONT_SIZE } from '../../constants/theme';

export const LoadingSpinner = () => (
    <View style={spinner.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
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
        color: COLORS.textLight,
        textAlign: 'center',
    },
});

const card = StyleSheet.create({
    container: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.sm,
    },
});
