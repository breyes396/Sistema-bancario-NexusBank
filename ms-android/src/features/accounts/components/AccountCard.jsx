import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
    getAccountTypeLabel,
    formatBalance,
    accountStatusLabel,
    getStatusBadgeStyle,
} from '../utils/accountHelpers';
import { PALETTE } from '../../../shared/constants/colors';
import styles from '../screens/AccountsListScreen.styles';

const AccountCard = ({ item, index, onPress, onCopy }) => {
    const typeLabel = getAccountTypeLabel(item.accountType);
    const statusLabel = accountStatusLabel(item.accountStatus);

    const accentColors = [PALETTE.navy700, PALETTE.navy500, PALETTE.navy300];
    const cardBgColor = accentColors[index % accentColors.length];

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: cardBgColor }]}
            onPress={onPress}
            activeOpacity={0.9}
        >
            <View style={styles.cardDecorCircleLg} />
            <View style={styles.cardDecorCircleSm} />

            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.bankName}>NexusBank</Text>
                    <Text style={styles.cardType}>{typeLabel}</Text>
                </View>
                <View style={[styles.statusBadge, getStatusBadgeStyle(item.accountStatus, styles)]}>
                    <Text style={styles.statusBadgeText}>{statusLabel}</Text>
                </View>
            </View>

            <View style={styles.cardChip} />

            <View style={styles.cardNumberContainer}>
                <Text style={styles.cardNumber} numberOfLines={1} adjustsFontSizeToFit>
                    {item.accountNumber ? item.accountNumber.replace(/(\d{4})/g, '$1 ').trim() : '•••• •••• ••••'}
                </Text>
                <TouchableOpacity
                    style={styles.copyBtn}
                    onPress={onCopy}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Feather name="copy" size={15} color="#ffffff" />
                </TouchableOpacity>
            </View>

            <View style={styles.cardFooter}>
                <Text style={styles.balanceLabel}>Saldo disponible</Text>
                <Text style={styles.balanceValue} numberOfLines={1} adjustsFontSizeToFit>
                    {formatBalance(item.accountBalance)}
                </Text>
            </View>

            <View style={styles.tapTipRow}>
                <Text style={styles.tapTip}>Ver movimientos</Text>
                <Feather name="chevron-right" size={14} color="rgba(255,255,255,0.8)" />
            </View>
        </TouchableOpacity>
    );
};

export default AccountCard;
