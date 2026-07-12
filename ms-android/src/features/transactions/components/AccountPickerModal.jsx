import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    FlatList,
} from 'react-native';
import { EmptyState } from '../../../shared/components/common/Common';
import { COLORS, SPACING, FONT_SIZE, SHADOWS } from '../../../shared/constants/theme';

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

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '60%',
        paddingBottom: SPACING.xl,
        ...SHADOWS.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    title: {
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    close: {
        fontSize: FONT_SIZE.lg,
        color: COLORS.textLight,
        paddingHorizontal: SPACING.sm,
    },
    item: {
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    itemSelected: {
        backgroundColor: '#eff6ff',
    },
    itemNumber: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
        fontWeight: '600',
    },
    itemSub: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.textLight,
        marginTop: 2,
    },
});

export default AccountPickerModal;
