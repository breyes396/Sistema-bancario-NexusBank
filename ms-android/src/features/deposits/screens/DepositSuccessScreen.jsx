import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
} from 'react-native';
import Button from '../../../shared/components/common/Button';
import { Card } from '../../../shared/components/common/Common';
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from '../../../shared/constants/theme';

const DepositSuccessScreen = ({ navigation, route }) => {
    const { deposit, amount, account } = route.params || {};

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleString('es-GT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const rows = [
        { label: 'N° Transacción', value: deposit?.id || '—' },
        { label: 'Cuenta destino', value: account?.accountNumber || deposit?.accountId || '—' },
        { label: 'Tipo de cuenta', value: account?.accountType || '—' },
        { label: 'Monto solicitado', value: `Q ${parseFloat(amount || 0).toFixed(2)}` },
        { label: 'Estado', value: deposit?.status || 'PENDIENTE' },
        { label: 'Fecha', value: formatDate(deposit?.createdAt) },
    ];

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.container}>
                {/* Icon circle */}
                <View style={styles.iconWrap}>
                    <Text style={styles.icon}>✓</Text>
                </View>

                <Text style={styles.title}>¡Solicitud Enviada!</Text>
                <Text style={styles.subtitle}>
                    Tu depósito está en estado{' '}
                    <Text style={styles.badge}>PENDIENTE</Text>
                    {' '}de aprobación por NexusBank.
                </Text>

                {/* Summary card */}
                <Card style={styles.card}>
                    <Text style={styles.cardTitle}>Resumen del Depósito</Text>
                    {rows.map((row) => (
                        <View key={row.label} style={styles.row}>
                            <Text style={styles.rowLabel}>{row.label}</Text>
                            <Text
                                style={[
                                    styles.rowValue,
                                    row.label === 'Monto solicitado' && styles.amountValue,
                                    row.label === 'Estado' && styles.statusValue,
                                ]}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                            >
                                {row.value}
                            </Text>
                        </View>
                    ))}
                </Card>

                <Card style={styles.noteCard}>
                    <Text style={styles.noteText}>
                        Recibirás una notificación cuando tu depósito sea procesado. El saldo se
                        reflejará en tu cuenta una vez aprobado.
                    </Text>
                </Card>

                <Button
                    title="Volver al Inicio"
                    onPress={() => navigation.navigate('Home')}
                    style={styles.btnPrimary}
                />
                <Button
                    title="Hacer Otro Depósito"
                    onPress={() => navigation.replace('Deposit')}
                    variant="secondary"
                    style={styles.btnSecondary}
                />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    container: {
        padding: SPACING.lg,
        paddingBottom: SPACING.xxl,
        alignItems: 'center',
    },
    iconWrap: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.success,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SPACING.xl,
        marginBottom: SPACING.lg,
        ...SHADOWS.md,
    },
    icon: {
        color: '#fff',
        fontSize: 36,
        fontWeight: 'bold',
    },
    title: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.sm,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textLight,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: SPACING.xl,
        paddingHorizontal: SPACING.md,
    },
    badge: {
        color: COLORS.warning,
        fontWeight: 'bold',
    },
    card: {
        width: '100%',
        marginBottom: SPACING.md,
    },
    cardTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.md,
        textAlign: 'center',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    rowLabel: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textLight,
        flex: 1,
    },
    rowValue: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text,
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
    },
    amountValue: {
        color: COLORS.primary,
        fontSize: FONT_SIZE.md,
    },
    statusValue: {
        color: COLORS.warning,
    },
    noteCard: {
        width: '100%',
        backgroundColor: '#fffbeb',
        borderColor: '#fde68a',
        marginBottom: SPACING.xl,
    },
    noteText: {
        fontSize: FONT_SIZE.xs,
        color: '#92400e',
        lineHeight: 18,
        textAlign: 'center',
    },
    btnPrimary: {
        marginBottom: SPACING.sm,
    },
    btnSecondary: {
        marginBottom: SPACING.sm,
    },
});

export default DepositSuccessScreen;
