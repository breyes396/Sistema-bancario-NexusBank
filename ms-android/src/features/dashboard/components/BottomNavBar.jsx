import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { DARK } from '../../../shared/constants/theme';
import styles from '../screens/DashboardScreen.styles';

const BottomNavBar = ({ openDrawer }) => (
    <View style={styles.bottomNav}>
        <View style={styles.navItem}>
            <Feather name="home" size={22} color={DARK.accent} />
            <Text style={[styles.navLabel, styles.navLabelActive]}>Inicio</Text>
        </View>
        <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.7}
            onPress={() => console.log('Bottom nav: Cuentas (próximamente)')}
        >
            <Feather name="credit-card" size={22} color={DARK.textMuted} />
            <Text style={styles.navLabel}>Cuentas</Text>
        </TouchableOpacity>
        <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.7}
            onPress={() => console.log('Bottom nav: Transferir (próximamente)')}
        >
            <Feather name="repeat" size={22} color={DARK.textMuted} />
            <Text style={styles.navLabel}>Transferir</Text>
        </TouchableOpacity>
        <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.7}
            onPress={() => console.log('Bottom nav: Historial (próximamente)')}
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
