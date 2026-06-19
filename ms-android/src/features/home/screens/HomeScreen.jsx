import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import authClient from '../../../shared/api/authClient';
import { COLORS } from '../../../shared/constants/theme';

const HomeScreen = () => {
    const [connected, setConnected] = useState(null); // null (loading) | true | false

    useEffect(() => {
        authClient.get('/health')
            .then(() => setConnected(true))
            .catch(() => setConnected(false));
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>¡Hola Mundo! </Text>
            <Text style={styles.subtitle}>Proyecto Inicial NexusBank Mobile</Text>
            
            <View style={styles.statusBox}>
                <Text style={styles.statusLabel}>Estado del Backend:</Text>
                {connected === null && (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                )}
                {connected === true && (
                    <Text style={styles.connectedText}>Conectado correctamente </Text>
                )}
                {connected === false && (
                    <Text style={styles.disconnectedText}>Error de conexión </Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textLight,
        marginBottom: 30,
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
    },
    statusLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginRight: 10,
    },
    connectedText: {
        fontSize: 14,
        color: COLORS.success,
        fontWeight: 'bold',
    },
    disconnectedText: {
        fontSize: 14,
        color: COLORS.error,
        fontWeight: 'bold',
    },
});

export default HomeScreen;
