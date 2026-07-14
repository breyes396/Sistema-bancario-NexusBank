import React, { useState, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReversions } from '../hooks/useReversions';
import { Card, EmptyState, LoadingSpinner } from '../../../shared/components/common/Common';
import HeaderMenuButton from '../../../shared/components/common/HeaderMenuButton';
import { BANK_DARK as BANK } from '../../../shared/constants/colors';
import styles from './ReversionsScreen.styles';

const STATUS_LABELS = {
    PENDING: 'Pendiente',
    APPROVED: 'Aprobada',
    REJECTED: 'Rechazada',
};

const STATUS_COLORS = {
    PENDING: BANK.warning,
    APPROVED: BANK.success,
    REJECTED: BANK.error,
};

const ReversionsScreen = ({ navigation }) => {
    const { reversions, loading, refetch } = useReversions();
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL', 'DEPOSITO', 'TRANSFERENCIA'
    const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'PENDING', 'APPROVED', 'REJECTED'

    const handleRefresh = useCallback(() => {
        refetch();
    }, [refetch]);

    const filteredReversions = useMemo(() => {
        return reversions.filter((item) => {
            // Type filter
            const matchesType = typeFilter === 'ALL' || String(item.type).toUpperCase() === typeFilter;
            
            // Status filter
            const matchesStatus = statusFilter === 'ALL' || String(item.status).toUpperCase() === statusFilter;
            
            // Search text filter
            const query = search.trim().toLowerCase();
            const matchesSearch = !query || [
                item.reference,
                item.reason,
                item.accountNumber,
                item.sourceAccountNumber,
                item.destinationAccountNumber,
                item.operationDescription,
            ].some(field => String(field || '').toLowerCase().includes(query));

            return matchesType && matchesStatus && matchesSearch;
        });
    }, [reversions, typeFilter, statusFilter, search]);

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-GT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderItem = ({ item }) => {
        const status = String(item.status).toUpperCase();
        const typeText = item.type === 'DEPOSITO' ? 'Depósito' : 'Transferencia';
        const badgeColor = STATUS_COLORS[status] || BANK.textMuted;

        return (
            <Card style={styles.card}>
                {/* Header row: Type & Ref + Status Badge */}
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.cardType}>{typeText} · Ref: {item.reference}</Text>
                        <Text style={styles.cardAmount}>Q {parseFloat(item.amount || 0).toFixed(2)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: badgeColor + '18' }]}>
                        <Text style={[styles.statusText, { color: badgeColor }]}>
                            {STATUS_LABELS[status] || item.status}
                        </Text>
                    </View>
                </View>

                {/* Details grid */}
                <View style={styles.detailsContainer}>
                    {item.accountNumber ? (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Cuenta afectada:</Text>
                            <Text style={styles.detailValue}>{item.accountNumber}</Text>
                        </View>
                    ) : (
                        <>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Cuenta origen:</Text>
                                <Text style={styles.detailValue}>{item.sourceAccountNumber}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Cuenta destino:</Text>
                                <Text style={styles.detailValue}>{item.destinationAccountNumber}</Text>
                            </View>
                        </>
                    )}
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Fecha solicitud:</Text>
                        <Text style={styles.detailValue}>{formatDate(item.createdAt)}</Text>
                    </View>
                    <View style={styles.detailBlock}>
                        <Text style={styles.detailLabel}>Motivo / Justificación:</Text>
                        <Text style={styles.reasonText}>{item.reason}</Text>
                    </View>
                    {item.adminComment ? (
                        <View style={styles.adminCommentBlock}>
                            <Text style={styles.adminCommentLabel}>Respuesta del Administrador:</Text>
                            <Text style={styles.adminCommentText}>{item.adminComment}</Text>
                        </View>
                    ) : null}
                </View>
            </Card>
        );
    };

    return (
        <SafeAreaView style={styles.safe}>
            {/* Header */}
            <View style={styles.header}>
                <HeaderMenuButton navigation={navigation} style={styles.backBtn} />
                <Text style={styles.title}>Reversiones</Text>
                <Text style={styles.subtitle}>
                    Seguimiento de tus solicitudes de reversión de transferencias y depósitos.
                </Text>
            </View>

            {/* Filters panel */}
            <View style={styles.filtersContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar por referencia, cuenta o motivo..."
                    placeholderTextColor={BANK.textMuted}
                    value={search}
                    onChangeText={setSearch}
                />
                <View style={styles.selectRow}>
                    <TouchableOpacity
                        style={[styles.filterSelector, styles.dropdownHalf]}
                        onPress={() => {
                            // Cycle type: ALL -> DEPOSITO -> TRANSFERENCIA -> ALL
                            setTypeFilter(prev => prev === 'ALL' ? 'DEPOSITO' : prev === 'DEPOSITO' ? 'TRANSFERENCIA' : 'ALL');
                        }}
                    >
                        <Text style={styles.filterSelectorText} numberOfLines={1}>
                            Tipo: {typeFilter === 'ALL' ? 'Todos' : typeFilter === 'DEPOSITO' ? 'Depósitos' : 'Transf.'}
                        </Text>
                        <Text style={styles.arrowIcon}>⇅</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.filterSelector, styles.dropdownHalf]}
                        onPress={() => {
                            // Cycle status: ALL -> PENDING -> APPROVED -> REJECTED -> ALL
                            setStatusFilter(prev => 
                                prev === 'ALL' ? 'PENDING' : 
                                prev === 'PENDING' ? 'APPROVED' : 
                                prev === 'APPROVED' ? 'REJECTED' : 'ALL'
                            );
                        }}
                    >
                        <Text style={styles.filterSelectorText} numberOfLines={1}>
                            Estado: {statusFilter === 'ALL' ? 'Todos' : STATUS_LABELS[statusFilter]}
                        </Text>
                        <Text style={styles.arrowIcon}>⇅</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Reversions List */}
            {loading && reversions.length === 0 ? (
                <LoadingSpinner />
            ) : (
                <FlatList
                    data={filteredReversions}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={loading}
                            onRefresh={handleRefresh}
                            colors={[BANK.primary]}
                        />
                    }
                    ListEmptyComponent={
                        <EmptyState message="No se encontraron solicitudes de reversión." />
                    }
                />
            )}
        </SafeAreaView>
    );
};

export default ReversionsScreen;
