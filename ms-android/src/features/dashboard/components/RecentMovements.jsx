import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BANK_DARK as DARK } from '../../../shared/constants/colors';
import { formatBalance } from '../../accounts/utils/accountHelpers';
import { isIncome, TYPE_LABELS } from '../../transactions/hooks/useTransactions';
import { formatMovementDate } from '../../../shared/utils/dateHelpers';
import styles from '../screens/DashboardScreen.styles';

const RECENT_MOVEMENTS_LIMIT = 5;

const RecentMovements = ({ transactions, loading, navigation }) => {
    const recentMovements = transactions.slice(0, RECENT_MOVEMENTS_LIMIT);

    const goToHistory = () => navigation?.navigate('MainTabs', { screen: 'Historial' });

    return (
        <>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Movimientos recientes</Text>
                <TouchableOpacity onPress={goToHistory} activeOpacity={0.7}>
                    <Text style={styles.sectionLink}>Ver todo</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator color={DARK.accent} style={{ marginVertical: 16 }} />
            ) : recentMovements.length === 0 ? (
                <Text style={styles.emptyText}>No hay movimientos recientes.</Text>
            ) : (
                recentMovements.map((item) => {
                    const income = isIncome(item.type);
                    const isReverted = item.status === 'REVERTIDA';
                    const color = isReverted ? DARK.textMuted : income ? DARK.income : DARK.expense;
                    const iconName = isReverted ? 'rotate-ccw' : income ? 'arrow-down-left' : 'arrow-up-right';

                    return (
                        <TouchableOpacity
                            key={item.id ?? `${item.type}-${item.createdAt}`}
                            style={styles.movementRow}
                            activeOpacity={0.7}
                            onPress={() => console.log('Movimiento:', item.id)}
                        >
                            <View style={[styles.movementIconWrap, { backgroundColor: color + '22' }]}>
                                <Feather name={iconName} size={18} color={color} />
                            </View>
                            <View style={styles.movementInfo}>
                                <Text style={styles.movementDesc} numberOfLines={1}>
                                    {item.description || TYPE_LABELS[item.type] || item.type}
                                </Text>
                                <Text style={styles.movementDate}>{formatMovementDate(item.createdAt)}</Text>
                            </View>
                            <Text style={[styles.movementAmount, { color }]}>
                                {income ? '+' : '-'}
                                {formatBalance(item.amount)}
                            </Text>
                        </TouchableOpacity>
                    );
                })
            )}
        </>
    );
};

export default RecentMovements;
