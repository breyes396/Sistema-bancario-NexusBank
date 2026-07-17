import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BANK_DARK as DARK } from '../../../shared/constants/colors';
import { formatBalance } from '../../accounts/utils/accountHelpers';
import styles from '../screens/DashboardScreen.styles';

const SummaryCards = ({ summary, loading }) => (
    <View style={styles.row}>
        <View style={styles.miniCard}>
            <View style={styles.miniCardTop}>
                <Feather name="arrow-down-left" size={18} color={DARK.income} />
                <Text style={styles.miniCardLabel}>Ingresos</Text>
            </View>
            <Text style={[styles.miniCardAmount, { color: DARK.income }]}>
                {loading ? '—' : formatBalance(summary?.totalIncome || 0)}
            </Text>
        </View>
        <View style={styles.miniCard}>
            <View style={styles.miniCardTop}>
                <Feather name="arrow-up-right" size={18} color={DARK.expense} />
                <Text style={styles.miniCardLabel}>Gastos</Text>
            </View>
            <Text style={[styles.miniCardAmount, { color: DARK.expense }]}>
                {loading ? '—' : formatBalance(summary?.totalExpense || 0)}
            </Text>
        </View>
    </View>
);

export default SummaryCards;
