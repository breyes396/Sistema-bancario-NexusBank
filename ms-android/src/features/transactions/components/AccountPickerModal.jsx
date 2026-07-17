import React from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    FlatList,
} from 'react-native';
import { EmptyState } from '../../../shared/components/common/Common';
import { accountPicker as styles } from '../screens/TransferScreen.styles';

const AccountPickerModal = ({ visible, onClose, accounts, selectedAccount, onSelectAccount, title }) => {
    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.close}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    {accounts.length === 0 ? (
                        <EmptyState message="No hay cuentas activas disponibles" />
                    ) : (
                        <FlatList
                            data={accounts}
                            keyExtractor={(item) => item.id?.toString() || item.accountNumber}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.item,
                                        selectedAccount?.accountNumber === item.accountNumber &&
                                            styles.itemSelected,
                                    ]}
                                    onPress={() => onSelectAccount(item)}
                                    activeOpacity={0.75}
                                >
                                    <Text style={styles.itemNumber}>{item.accountNumber}</Text>
                                    <Text style={styles.itemSub}>
                                        {item.accountType} · Q{parseFloat(item.accountBalance || 0).toFixed(2)}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
};

export default AccountPickerModal;
