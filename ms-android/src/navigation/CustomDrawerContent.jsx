import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../shared/store/authStore';
import { useNavigationStore } from '../shared/store/navigationStore';
import { BANK_DARK as DARK } from '../shared/constants/colors';
import { getInitials } from '../shared/utils/stringHelpers';
import styles from './CustomDrawerContent.styles';

const MENU_ITEMS = [
    { key: 'Inicio', label: 'Inicio', icon: 'home' },
    { key: 'Cuentas', label: 'Mis cuentas', icon: 'credit-card' },
    { key: 'Historial', label: 'Historial', icon: 'clock' },
    { key: 'Depositos', label: 'Depósitos', icon: 'arrow-down-circle' },
    { key: 'Transferencias', label: 'Transferencias', icon: 'send' },
    { key: 'Reversiones', label: 'Reversiones', icon: 'rotate-ccw' },
    { key: 'Favoritos', label: 'Favoritos', icon: 'star' },
    { key: 'Promociones', label: 'Promociones', icon: 'gift' },
];

// Mapea el nombre de pantalla realmente enfocado (dentro de MainTabs o Secondary)
// al key del ítem de menú correspondiente, para resaltar el que está activo.
const ROUTE_NAME_TO_MENU_KEY = {
    Inicio: 'Inicio',
    Historial: 'Historial',
    AccountsList: 'Cuentas',
    Deposit: 'Depositos',
    DepositSuccess: 'Depositos',
    Transfer: 'Transferencias',
    TransferSuccess: 'Transferencias',
    Reversions: 'Reversiones',
    Favorites: 'Favoritos',
    Promotions: 'Promociones',
};

const CustomDrawerContent = (props) => {
    const { navigation } = props;
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const activeRouteName = useNavigationStore((state) => state.activeRouteName);

    const fullName = user?.name || user?.username || 'Usuario';

    const activeMenuKey = ROUTE_NAME_TO_MENU_KEY[activeRouteName] || null;

    const handleItemPress = (item) => {
        switch (item.key) {
            case 'Inicio':
                navigation.navigate('MainTabs', { screen: 'Inicio' });
                navigation.closeDrawer();
                break;
            case 'Cuentas':
                navigation.navigate('Secondary', { screen: 'AccountsList' });
                navigation.closeDrawer();
                break;
            case 'Historial':
                navigation.navigate('MainTabs', { screen: 'Historial' });
                navigation.closeDrawer();
                break;
            case 'Depositos':
                navigation.navigate('Secondary', { screen: 'Deposit' });
                navigation.closeDrawer();
                break;
            case 'Transferencias':
                navigation.navigate('Secondary', { screen: 'Transfer' });
                navigation.closeDrawer();
                break;
            case 'Reversiones':
                navigation.navigate('Secondary', { screen: 'Reversions' });
                navigation.closeDrawer();
                break;
            case 'Favoritos':
                navigation.navigate('Secondary', { screen: 'Favorites' });
                navigation.closeDrawer();
                break;
            case 'Promociones':
                navigation.navigate('Secondary', { screen: 'Promotions' });
                navigation.closeDrawer();
                break;
            default:
                console.log(`Menú: ${item.label} (próximamente)`);
                navigation.closeDrawer();
        }
    };

    const handleLogout = () => {
        navigation.closeDrawer();
        Alert.alert(
            'Cerrar sesión',
            '¿Estás seguro de que deseas salir de tu cuenta de NexusBank?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sí, salir', style: 'destructive', onPress: () => logout() },
            ],
        );
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left']}>
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(fullName)}</Text>
                </View>
                <Text style={styles.userName} numberOfLines={1}>{fullName}</Text>
                <Text style={styles.userSubtitle}>Cliente</Text>
            </View>

            <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
                {MENU_ITEMS.map((item) => {
                    const isActive = item.key === activeMenuKey;
                    return (
                        <TouchableOpacity
                            key={item.key}
                            style={[styles.menuItem, isActive && styles.menuItemActive]}
                            onPress={() => handleItemPress(item)}
                            activeOpacity={0.75}
                        >
                            <Feather
                                name={item.icon}
                                size={20}
                                color={isActive ? DARK.text : DARK.textMuted}
                            />
                            <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.separator} />
                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={handleLogout}
                    activeOpacity={0.75}
                >
                    <Feather name="log-out" size={20} color={DARK.danger} />
                    <Text style={styles.logoutText}>Cerrar sesión</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default CustomDrawerContent;
