import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useProfileStore } from '../../../shared/store/profileStore';
import { BANK_DARK as DARK } from '../../../shared/constants/colors';
import { getInitials } from '../../../shared/utils/stringHelpers';
import styles from '../screens/DashboardScreen.styles';

const DashboardHeader = ({ fullName, openDrawer, navigation }) => {
    const photoUrl = useProfileStore((state) => state.photoUrl);

    const goToProfile = () => {
        navigation?.navigate('Secondary', { screen: 'Profile' });
    };

    return (
        <View style={styles.header}>
            <TouchableOpacity style={styles.iconBtn} onPress={openDrawer} activeOpacity={0.7}>
                <Feather name="menu" size={24} color={DARK.text} />
            </TouchableOpacity>
            <Text style={styles.brand}>NexusBank</Text>
            <View style={styles.headerRight}>
                <TouchableOpacity style={styles.avatarSmall} onPress={goToProfile} activeOpacity={0.8}>
                    {photoUrl ? (
                        <Image source={{ uri: photoUrl }} style={styles.avatarSmallImage} />
                    ) : (
                        <Text style={styles.avatarSmallText}>{getInitials(fullName)}</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default DashboardHeader;
