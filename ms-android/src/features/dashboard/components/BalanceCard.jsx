import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BANK_DARK as DARK } from '../../../shared/constants/colors';
import { formatBalance } from '../../accounts/utils/accountHelpers';
import { formatUpdatedAt } from '../../../shared/utils/dateHelpers';
import styles from '../screens/DashboardScreen.styles';

const BalanceCard = ({ consolidatedBalance, updatedAt, loading }) => {
    const [hideBalance, setHideBalance] = useState(false);

    return (
        <View style={styles.balanceCard}>
            <View style={styles.balanceHeaderRow}>
                <Text style={styles.balanceLabel}>Saldo total consolidado</Text>
                <TouchableOpacity onPress={() => setHideBalance((prev) => !prev)} activeOpacity={0.7}>
                    <Feather name={hideBalance ? 'eye-off' : 'eye'} size={20} color={DARK.text} />
                </TouchableOpacity>
            </View>
            {loading ? (
                <ActivityIndicator color={DARK.text} style={{ marginTop: 12, alignSelf: 'flex-start' }} />
            ) : (
                <Text style={styles.balanceAmount}>
                    {hideBalance ? '••••••' : formatBalance(consolidatedBalance)}
                </Text>
            )}
            <Text style={styles.balanceUpdated}>{updatedAt ? formatUpdatedAt(updatedAt) : ' '}</Text>
        </View>
    );
};

export default BalanceCard;
