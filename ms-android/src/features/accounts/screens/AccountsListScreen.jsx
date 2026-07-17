import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Alert,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useAccounts } from '../hooks/useAccounts';
import { useAccountRequest } from '../hooks/useAccountRequest';
import AccountCard from '../components/AccountCard';
import NewAccountRequestModal from '../components/NewAccountRequestModal';
import { EmptyState } from '../../../shared/components/common/Common';
import InfoModal from '../../../shared/components/common/InfoModal';
import HeaderMenuButton from '../../../shared/components/common/HeaderMenuButton';
import BottomNavBar from '../../../shared/components/common/BottomNavBar';
import { BANK_DARK as BANK } from '../../../shared/constants/colors';
import styles from './AccountsListScreen.styles';

const AccountsListScreen = ({ navigation }) => {
    const { accounts, loading, error, refetch } = useAccounts();
    const { submitting, submitRequest } = useAccountRequest();
    const [requestModalVisible, setRequestModalVisible] = useState(false);
    const [infoModal, setInfoModal] = useState({ visible: false, type: 'success', title: '', message: '' });

    const handleCopyNumber = async (number) => {
        await Clipboard.setStringAsync(number);
        Alert.alert('Copiado', 'El número de cuenta ha sido copiado al portapapeles.');
    };

    const closeInfoModal = () => setInfoModal((prev) => ({ ...prev, visible: false }));

    const handleSubmitAccountRequest = async ({ accountType, note }) => {
        const result = await submitRequest({ accountType, note });
        setRequestModalVisible(false);
        setInfoModal({
            visible: true,
            type: 'success',
            title: 'Solicitud enviada',
            message: `Tu solicitud de ${accountType === 'ahorro' ? 'Cuenta de Ahorros' : 'Cuenta Corriente'} quedó en estado ${result?.status || 'PENDIENTE'}, a la espera de aprobación del administrador.`,
        });
        refetch();
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
                <TouchableOpacity
                    style={styles.requestBtn}
                    onPress={() => setRequestModalVisible(true)}
                    activeOpacity={0.8}
                >
                    <Feather name="plus-circle" size={18} color={BANK.primary} />
                    <Text style={styles.requestBtnText}>Solicitar Cuenta</Text>
                </TouchableOpacity>
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

            <NewAccountRequestModal
                visible={requestModalVisible}
                onClose={() => setRequestModalVisible(false)}
                onSubmit={handleSubmitAccountRequest}
                submitting={submitting}
            />

            <InfoModal
                visible={infoModal.visible}
                type={infoModal.type}
                title={infoModal.title}
                message={infoModal.message}
                onClose={closeInfoModal}
            />
        </SafeAreaView>
    );
};

export default AccountsListScreen;
