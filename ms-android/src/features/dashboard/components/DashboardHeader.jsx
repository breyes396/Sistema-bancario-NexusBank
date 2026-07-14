import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BANK_DARK as DARK } from '../../../shared/constants/colors';
import { getInitials } from '../../../shared/utils/stringHelpers';
import styles from '../screens/DashboardScreen.styles';

const DashboardHeader = ({ fullName, openDrawer }) => (
    <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={openDrawer} activeOpacity={0.7}>
            <Feather name="menu" size={24} color={DARK.text} />
        </TouchableOpacity>
        <Text style={styles.brand}>NexusBank</Text>
        <View style={styles.headerRight}>
            <TouchableOpacity
                style={styles.iconBtn}
                activeOpacity={0.7}
                onPress={() => console.log('Notificaciones (próximamente)')}
            >
                <Feather name="bell" size={22} color={DARK.text} />
                <View style={styles.notifDot} />
            </TouchableOpacity>
            <View style={styles.avatarSmall}>
                <Text style={styles.avatarSmallText}>{getInitials(fullName)}</Text>
            </View>
        </View>
    </View>
);

export default DashboardHeader;
