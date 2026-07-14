import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { BANK_DARK as DARK } from '../../constants/colors';
import { useNavigationStore } from '../../store/navigationStore';
import styles from './BottomNavBar.styles';

// Mapea el nombre de pantalla realmente enfocado al ítem de la barra que le
// corresponde resaltar. Las pantallas que no están acá (Depósitos, Reversiones,
// Favoritos, Promociones) hacen que "Más" quede como el ítem activo.
const ROUTE_NAME_TO_TAB_KEY = {
    Inicio: 'Inicio',
    Historial: 'Historial',
    AccountsList: 'Cuentas',
    Transfer: 'Transferir',
    TransferSuccess: 'Transferir',
};

const TABS = [
    {
        key: 'Inicio',
        label: 'Inicio',
        icon: 'home',
        onPress: (navigation) => navigation.navigate('MainTabs', { screen: 'Inicio' }),
    },
    {
        key: 'Cuentas',
        label: 'Cuentas',
        icon: 'credit-card',
        onPress: (navigation) => navigation.navigate('Secondary', { screen: 'AccountsList' }),
    },
    {
        key: 'Transferir',
        label: 'Transferir',
        icon: 'repeat',
        onPress: (navigation) => navigation.navigate('Secondary', { screen: 'Transfer' }),
    },
    {
        key: 'Historial',
        label: 'Historial',
        icon: 'file-text',
        onPress: (navigation) => navigation.navigate('MainTabs', { screen: 'Historial' }),
    },
];

const BottomNavBar = ({ navigation }) => {
    const activeRouteName = useNavigationStore((state) => state.activeRouteName);
    const activeTabKey = ROUTE_NAME_TO_TAB_KEY[activeRouteName] || null;
    const isMoreActive = !activeTabKey;

    return (
        <View style={styles.bottomNav}>
            {TABS.map((tab) => {
                const isActive = tab.key === activeTabKey;
                return (
                    <TouchableOpacity
                        key={tab.key}
                        style={styles.navItem}
                        activeOpacity={0.7}
                        onPress={() => tab.onPress(navigation)}
                    >
                        <Feather name={tab.icon} size={22} color={isActive ? DARK.accent : DARK.textMuted} />
                        <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{tab.label}</Text>
                    </TouchableOpacity>
                );
            })}
            <TouchableOpacity
                style={styles.navItem}
                activeOpacity={0.7}
                onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            >
                <Feather name="more-horizontal" size={22} color={isMoreActive ? DARK.accent : DARK.textMuted} />
                <Text style={[styles.navLabel, isMoreActive && styles.navLabelActive]}>Más</Text>
            </TouchableOpacity>
        </View>
    );
};

export default BottomNavBar;
