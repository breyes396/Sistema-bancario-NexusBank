import React from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Alert,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useAccounts } from '../hooks/useAccounts';
import AccountCard from '../components/AccountCard';
import { LoadingSpinner, EmptyState } from '../../../shared/components/common/Common';
import { COLORS } from '../../../shared/constants/theme';
import styles from './AccountsListScreen.styles';

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

export default AccountsListScreen;
