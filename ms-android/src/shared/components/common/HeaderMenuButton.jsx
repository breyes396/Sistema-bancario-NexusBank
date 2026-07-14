import React from 'react';
import { TouchableOpacity } from 'react-native';
import { DrawerActions } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { BANK_DARK as BANK } from '../../constants/colors';

const HeaderMenuButton = ({ navigation, style }) => (
    <TouchableOpacity
        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        style={style}
        activeOpacity={0.7}
    >
        <Feather name="menu" size={22} color={BANK.text} />
    </TouchableOpacity>
);

export default HeaderMenuButton;
