import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Button from '../../../shared/components/common/Button';
import { Card } from '../../../shared/components/common/Common';
import { downloadReceiptPdf } from '../../../shared/utils/receiptPdf';
import { BANK_DARK as BANK } from '../../../shared/constants/colors';
import styles from './DepositSuccessScreen.styles';

const DepositSuccessScreen = ({ navigation, route }) => {
    const { deposit, amount, account } = route.params || {};
    const [downloading, setDownloading] = useState(false);

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

    const handleDownloadReceipt = async () => {
        setDownloading(true);
        try {
            await downloadReceiptPdf({
                title: 'Comprobante de Depósito',
                subtitle: 'Solicitud pendiente de aprobación administrativa',
                rows,
            });
        } catch (err) {
            Alert.alert('No se pudo generar el comprobante', 'Intenta de nuevo.');
        } finally {
            setDownloading(false);
        }
    };

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

                <TouchableOpacity
                    style={styles.downloadBtn}
                    onPress={handleDownloadReceipt}
                    activeOpacity={0.8}
                    disabled={downloading}
                >
                    {downloading ? (
                        <ActivityIndicator size="small" color={BANK.accent} />
                    ) : (
                        <>
                            <Feather name="download" size={18} color={BANK.accent} />
                            <Text style={styles.downloadBtnText}>Descargar comprobante</Text>
                        </>
                    )}
                </TouchableOpacity>

                <Card style={styles.noteCard}>
                    <Text style={styles.noteText}>
                        Recibirás una notificación cuando tu depósito sea procesado. El saldo se
                        reflejará en tu cuenta una vez aprobado.
                    </Text>
                </Card>

                <Button
                    title="Volver al Inicio"
                    onPress={() => navigation.navigate('MainTabs', { screen: 'Inicio' })}
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

export default DepositSuccessScreen;
