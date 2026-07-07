import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import authClient from '../../../shared/api/authClient';
import Button from '../../../shared/components/common/Button';
import { COLORS, SPACING, FONT_SIZE } from '../../../shared/constants/theme';

const HomeScreen = ({ navigation }) => {
    const [connected, setConnected] = useState(null); // null (loading) | true | false

    useEffect(() => {
        authClient.get('/health')
            .then(() => setConnected(true))
            .catch(() => setConnected(false));
    }, []);

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <Text style={styles.title}>¡Hola Mundo!</Text>
                <Text style={styles.subtitle}>Proyecto Inicial NexusBank Mobile</Text>

                <View style={styles.statusBox}>
                    <Text style={styles.statusLabel}>Estado del Backend:</Text>
                    {connected === null && (
                        <ActivityIndicator size="small" color={COLORS.primary} />
                    )}
                    {connected === true && (
                        <Text style={styles.connectedText}>Conectado correctamente</Text>
                    )}
                    {connected === false && (
                        <Text style={styles.disconnectedText}>Error de conexión</Text>
                    )}
                </View>

                <View style={styles.actions}>
                    <Button
                        title="Depositar"
                        onPress={() => navigation.navigate('Deposit')}
                    />
                    <Button
                        title="Historial de Transacciones"
                        onPress={() => navigation.navigate('Transactions')}
                        variant="secondary"
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    title: {
        fontSize: FONT_SIZE.huge,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    subtitle: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textLight,
        marginBottom: SPACING.lg,
    },
    statusBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: SPACING.xl,
    },
    statusLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.text,
        marginRight: 10,
    },
    connectedText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.success,
        fontWeight: 'bold',
    },
    disconnectedText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.error,
        fontWeight: 'bold',
    },
    actions: {
        width: '100%',
        gap: SPACING.sm,
    },
});

export default HomeScreen;
