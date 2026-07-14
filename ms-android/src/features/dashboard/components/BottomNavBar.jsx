import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BANK_DARK as DARK } from '../../../shared/constants/colors';
import styles from '../screens/DashboardScreen.styles';

const BottomNavBar = ({ openDrawer, navigation }) => (
    <View style={styles.bottomNav}>
        <View style={styles.navItem}>
            <Feather name="home" size={22} color={DARK.accent} />
            <Text style={[styles.navLabel, styles.navLabelActive]}>Inicio</Text>
        </View>
        <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.7}
            onPress={() => navigation?.navigate('Secondary', { screen: 'AccountsList' })}
        >
            <Feather name="credit-card" size={22} color={DARK.textMuted} />
            <Text style={styles.navLabel}>Cuentas</Text>
        </TouchableOpacity>
        <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.7}
            onPress={() => navigation?.navigate('Secondary', { screen: 'Transfer' })}
        >
            <Feather name="repeat" size={22} color={DARK.textMuted} />
            <Text style={styles.navLabel}>Transferir</Text>
        </TouchableOpacity>
        <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.7}
            onPress={() => navigation?.navigate('Historial')}
        >
            <Feather name="file-text" size={22} color={DARK.textMuted} />
            <Text style={styles.navLabel}>Historial</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7} onPress={openDrawer}>
            <Feather name="more-horizontal" size={22} color={DARK.textMuted} />
            <Text style={styles.navLabel}>Más</Text>
        </TouchableOpacity>
    </View>
);

export default BottomNavBar;
