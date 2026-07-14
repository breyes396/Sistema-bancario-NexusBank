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
import styles from './TransferSuccessScreen.styles';

const TransferSuccessScreen = ({ navigation, route }) => {
    const { transfer, amount, sourceAccount, destinationNumber, recipientType, description, currency } = route.params || {};
    const [downloading, setDownloading] = useState(false);

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
        {
            label: 'Monto transferido',
            value: `${currency && currency !== 'GTQ' ? currency : 'Q'} ${parseFloat(amount || 0).toFixed(2)}`,
        },
        { label: 'Concepto', value: description || 'Sin concepto' },
        { label: 'Estado', value: transfer?.status || 'COMPLETADA' },
        { label: 'Fecha y hora', value: formatDate(transfer?.createdAt) },
    ];

    const handleDownloadReceipt = async () => {
        setDownloading(true);
        try {
            await downloadReceiptPdf({
                title: 'Comprobante de Transferencia',
                subtitle: 'Transferencia completada exitosamente',
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
                        Esta transferencia no requiere validación posterior y ya ha sido debitada de tu cuenta origen.
                    </Text>
                </Card>

                <Button
                    title="Volver al Inicio"
                    onPress={() => navigation.navigate('MainTabs', { screen: 'Inicio' })}
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

export default TransferSuccessScreen;
