import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { useAuthStore } from '../../../shared/store/authStore';
import { Card } from '../../../shared/components/common/Common';
import styles from './DashboardScreen.styles';

const ComingSoon = (feature) => () =>
    Alert.alert('Próximamente', `${feature} estará disponible en una próxima actualización.`);

const QuickAction = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.actionIconWrap}>
            <Text style={styles.actionIcon}>{icon}</Text>
        </View>
        <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
);

const DashboardScreen = ({ navigation }) => {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    const firstName = (user?.name || user?.username || 'Usuario').split(' ')[0];

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Hola, {firstName} 👋</Text>
                        <Text style={styles.subtitle}>Bienvenido de nuevo a NexusBank</Text>
                    </View>
                    <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                        <Text style={styles.logoutText}>Salir</Text>
                    </TouchableOpacity>
                </View>

                <Card style={styles.welcomeCard}>
                    <Text style={styles.welcomeLabel}>Cuenta</Text>
                    <Text style={styles.welcomeValue}>{user?.email}</Text>
                </Card>

                <Text style={styles.sectionTitle}>Acceso rápido</Text>
                <View style={styles.grid}>
                    <QuickAction icon="↔" label="Transferir" onPress={ComingSoon('Las transferencias')} />
                    <QuickAction icon="🏦" label="Ver Cuentas" onPress={ComingSoon('El detalle de cuentas')} />
                    <QuickAction icon="★" label="Favoritos" onPress={ComingSoon('Los favoritos')} />
                    <QuickAction
                        icon="↓"
                        label="Depositar"
                        onPress={() => navigation.navigate('Deposit')}
                    />
                </View>

                <Text style={styles.sectionTitle}>Movimientos</Text>
                <TouchableOpacity
                    style={styles.historyRow}
                    onPress={() => navigation.navigate('Historial')}
                    activeOpacity={0.8}
                >
                    <Card style={styles.historyCard}>
                        <Text style={styles.historyText}>Ver historial de transacciones</Text>
                        <Text style={styles.historyArrow}>›</Text>
                    </Card>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

export default DashboardScreen;
