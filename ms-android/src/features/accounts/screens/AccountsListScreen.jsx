import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useAccounts } from '../hooks/useAccounts';
import { LoadingSpinner, EmptyState } from '../../../shared/components/common/Common';
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from '../../../shared/constants/theme';

const getAccountTypeLabel = (type) => {
    const rawType = String(type || '').trim().toLowerCase();
    if (rawType.includes('corrient') || rawType.includes('monetar')) return 'Cuenta Monetaria';
    if (rawType.includes('ahor')) return 'Cuenta de Ahorros';
    return 'Cuenta Monetaria';
};

const formatBalance = (balance) => {
    return `Q${parseFloat(balance || 0).toLocaleString('es-GT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

const accountStatusLabel = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'FROZEN') return 'Congelada';
    if (s === 'SUSPENDED') return 'Suspendida';
    if (s === 'BLOCKED') return 'Bloqueada';
    if (s === 'CLOSED') return 'Cerrada';
    if (s === 'UNDER_REVIEW') return 'En revisión';
    return 'Activa';
};

const getStatusBadgeStyle = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'ACTIVE') return styles.statusActive;
    if (['FROZEN', 'SUSPENDED', 'BLOCKED'].includes(s)) return styles.statusBlocked;
    return styles.statusReview;
};

const AccountsListScreen = ({ navigation }) => {
    const { accounts, loading, error, refetch } = useAccounts();

    const handleCopyNumber = async (number) => {
        await Clipboard.setStringAsync(number);
        Alert.alert('Copiado', 'El número de cuenta ha sido copiado al portapapeles.');
    };

    const handleSelectAccount = (account) => {
        navigation.navigate('Historial', {
            accountId: account.id,
            accountNumber: account.accountNumber,
        });
    };

    const renderCard = ({ item, index }) => {
        const typeLabel = getAccountTypeLabel(item.accountType);
        const statusLabel = accountStatusLabel(item.accountStatus);
        
        const accentColors = ['#1a365d', '#2d3748', '#1a202c'];
        const cardBgColor = accentColors[index % accentColors.length];

        return (
            <TouchableOpacity
                style={[styles.card, { backgroundColor: cardBgColor }]}
                onPress={() => handleSelectAccount(item)}
                activeOpacity={0.9}
            >
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.bankName}>NexusBank</Text>
                        <Text style={styles.cardType}>{typeLabel}</Text>
                    </View>
                    <View style={styles.chipLogoContainer}>
                        <View style={styles.cardChip} />
                        <View style={[styles.statusBadge, getStatusBadgeStyle(item.accountStatus)]}>
                            <Text style={styles.statusBadgeText}>{statusLabel}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.cardNumberContainer}>
                    <Text style={styles.cardNumber}>
                        {item.accountNumber ? item.accountNumber.replace(/(\d{4})/g, '$1 ').trim() : '•••• •••• ••••'}
                    </Text>
                    <TouchableOpacity
                        style={styles.copyBtn}
                        onPress={() => handleCopyNumber(item.accountNumber)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.copyBtnText}>📋 Copiar</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.cardFooter}>
                    <View>
                        <Text style={styles.balanceLabel}>Saldo disponible</Text>
                        <Text style={styles.balanceValue}>{formatBalance(item.accountBalance)}</Text>
                    </View>
                    <Text style={styles.tapTip}>Ver movimientos ›</Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading && accounts.length === 0) return <LoadingSpinner />;

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>← Volver</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Mis Cuentas Bancarias</Text>
                <Text style={styles.subtitle}>Consulta tus saldos y detalles de cuentas activas</Text>
            </View>

            <FlatList
                data={accounts}
                keyExtractor={(item) => item.id?.toString() || item.accountNumber}
                renderItem={renderCard}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={refetch}
                        colors={[COLORS.primary]}
                        tintColor={COLORS.primary}
                    />
                }
                ListEmptyComponent={
                    !loading && (
                        <EmptyState message="No se encontraron cuentas bancarias asociadas." />
                    )
                }
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        padding: SPACING.lg,
        paddingBottom: SPACING.sm,
    },
    backBtn: {
        marginBottom: SPACING.sm,
    },
    backText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.primary,
        fontWeight: '600',
    },
    title: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    subtitle: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textLight,
    },
    list: {
        padding: SPACING.lg,
        paddingBottom: SPACING.xxl,
    },
    card: {
        borderRadius: 16,
        padding: SPACING.xl,
        marginBottom: SPACING.lg,
        ...SHADOWS.md,
        minHeight: 180,
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    bankName: {
        color: '#ffffff',
        fontSize: FONT_SIZE.md,
        fontWeight: '800',
        letterSpacing: 1,
    },
    cardType: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: FONT_SIZE.xs,
        marginTop: 2,
    },
    chipLogoContainer: {
        alignItems: 'flex-end',
    },
    cardChip: {
        width: 35,
        height: 25,
        backgroundColor: '#ecc94b',
        borderRadius: 4,
        marginBottom: SPACING.xs,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 20,
    },
    statusActive: {
        backgroundColor: 'rgba(72, 187, 120, 0.25)',
    },
    statusBlocked: {
        backgroundColor: 'rgba(245, 101, 101, 0.25)',
    },
    statusReview: {
        backgroundColor: 'rgba(237, 137, 54, 0.25)',
    },
    statusBadgeText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    cardNumberContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: SPACING.md,
    },
    cardNumber: {
        color: '#ffffff',
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    copyBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
    },
    copyBtnText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: '600',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    balanceLabel: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    balanceValue: {
        color: '#ffffff',
        fontSize: FONT_SIZE.xl,
        fontWeight: 'bold',
        marginTop: 2,
    },
    tapTip: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: FONT_SIZE.xs,
        fontWeight: '500',
    },
});

export default AccountsListScreen;
