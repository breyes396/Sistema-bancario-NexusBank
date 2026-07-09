import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
    getAccountTypeLabel,
    formatBalance,
    accountStatusLabel,
    getStatusBadgeStyle,
} from '../utils/accountHelpers';
import styles from '../screens/AccountsListScreen.styles';

const AccountCard = ({ item, index, onPress, onCopy }) => {
    const typeLabel = getAccountTypeLabel(item.accountType);
    const statusLabel = accountStatusLabel(item.accountStatus);
    
    const accentColors = ['#1a365d', '#2d3748', '#1a202c'];
    const cardBgColor = accentColors[index % accentColors.length];

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: cardBgColor }]}
            onPress={onPress}
            activeOpacity={0.9}
        >
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.bankName}>NexusBank</Text>
                    <Text style={styles.cardType}>{typeLabel}</Text>
                </View>
                <View style={styles.chipLogoContainer}>
                    <View style={styles.cardChip} />
                    <View style={[styles.statusBadge, getStatusBadgeStyle(item.accountStatus, styles)]}>
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
                    onPress={onCopy}
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

export default AccountCard;
