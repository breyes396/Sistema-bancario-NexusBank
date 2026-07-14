import React from 'react';
import {
    View,
    Text,
    FlatList,
    Alert,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useAccounts } from '../hooks/useAccounts';
import AccountCard from '../components/AccountCard';
import { EmptyState } from '../../../shared/components/common/Common';
import HeaderMenuButton from '../../../shared/components/common/HeaderMenuButton';
import BottomNavBar from '../../../shared/components/common/BottomNavBar';
import { BANK_DARK as BANK } from '../../../shared/constants/colors';
import styles from './AccountsListScreen.styles';

const AccountsListScreen = ({ navigation }) => {
    const { accounts, loading, error, refetch } = useAccounts();

    const handleCopyNumber = async (number) => {
        await Clipboard.setStringAsync(number);
        Alert.alert('Copiado', 'El número de cuenta ha sido copiado al portapapeles.');
    };

    const handleSelectAccount = (account) => {
        navigation.navigate('MainTabs', {
            screen: 'Historial',
            params: {
                accountId: account.id,
                accountNumber: account.accountNumber,
            },
        });
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <HeaderMenuButton navigation={navigation} style={styles.backBtn} />
                <Text style={styles.title}>Mis Cuentas Bancarias</Text>
                <Text style={styles.subtitle}>Consulta tus saldos y detalles de cuentas activas</Text>
            </View>

            <FlatList
                data={accounts}
                keyExtractor={(item) => item.id?.toString() || item.accountNumber}
                renderItem={({ item, index }) => (
                    <AccountCard
                        item={item}
                        index={index}
                        onPress={() => handleSelectAccount(item)}
                        onCopy={() => handleCopyNumber(item.accountNumber)}
                    />
                )}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={refetch}
                        colors={[BANK.primary]}
                        tintColor={BANK.primary}
                    />
                }
                ListEmptyComponent={
                    !loading && (
                        <EmptyState message="No se encontraron cuentas bancarias asociadas." />
                    )
                }
                showsVerticalScrollIndicator={false}
            />

            <BottomNavBar navigation={navigation} />
        </SafeAreaView>
    );
};

export default AccountsListScreen;
