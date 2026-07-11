import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../shared/components/common/Button';
import { Card } from '../../../shared/components/common/Common';
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from '../../../shared/constants/theme';

const TransferSuccessScreen = ({ navigation, route }) => {
    const { transfer, amount, sourceAccount, destinationNumber, recipientType, description } = route.params || {};

    const formatDate = (dateStr) => {
        const d = dateStr ? new Date(dateStr) : new Date();
        return d.toLocaleString('es-GT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const rows = [
        { label: 'N° de Referencia', value: transfer?.transactionId || transfer?.id || '—' },
        { label: 'Cuenta origen', value: sourceAccount?.accountNumber || '—' },
        { label: 'Cuenta destino', value: destinationNumber || '—' },
        { label: 'Tipo de destinatario', value: recipientType === 'PROPIA' ? 'Cuenta propia' : 'Tercero' },
        { label: 'Monto transferido', value: `Q ${parseFloat(amount || 0).toFixed(2)}` },
        { label: 'Concepto', value: description || 'Sin concepto' },
        { label: 'Estado', value: transfer?.status || 'COMPLETADA' },
        { label: 'Fecha y hora', value: formatDate(transfer?.createdAt) },
    ];

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.container}>
                {/* Success Icon */}
                <View style={styles.iconWrap}>
                    <Text style={styles.icon}>✓</Text>
                </View>

                <Text style={styles.title}>¡Transferencia Realizada!</Text>
                <Text style={styles.subtitle}>
                    El dinero se ha enviado al instante a la cuenta destino seleccionada.
                </Text>

                {/* Voucher Card */}
                <Card style={styles.card}>
                    <Text style={styles.cardTitle}>Comprobante Digital</Text>
                    {rows.map((row) => (
                        <View key={row.label} style={styles.row}>
                            <Text style={styles.rowLabel}>{row.label}</Text>
                            <Text
                                style={[
                                    styles.rowValue,
                                    row.label === 'Monto transferido' && styles.amountValue,
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
                        Esta transferencia no requiere validación posterior y ya ha sido debitada de tu cuenta origen.
                    </Text>
                </Card>

                <Button
                    title="Volver al Inicio"
                    onPress={() => navigation.navigate('Main')}
                    style={styles.btnPrimary}
                />
                <Button
                    title="Hacer Otra Transferencia"
                    onPress={() => navigation.replace('Transfer')}
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
        fontWeight: 'bold',
    },
    statusValue: {
        color: COLORS.success,
        fontWeight: 'bold',
    },
    noteCard: {
        width: '100%',
        backgroundColor: '#f0fdf4',
        borderColor: '#bbf7d0',
        marginBottom: SPACING.xl,
    },
    noteText: {
        fontSize: FONT_SIZE.xs,
        color: '#166534',
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

export default TransferSuccessScreen;
