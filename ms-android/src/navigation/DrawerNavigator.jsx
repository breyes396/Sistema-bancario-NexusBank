import React from 'react';
import { Dimensions } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import MainTabNavigator from './MainTabNavigator';
import CustomDrawerContent from './CustomDrawerContent';
import { DARK } from '../shared/constants/theme';

const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
    return (
        <Drawer.Navigator
            screenOptions={{
                headerShown: false,
                drawerType: 'front',
                drawerStyle: {
                    width: Dimensions.get('window').width * 0.75,
                    backgroundColor: DARK.background,
                },
                overlayColor: 'rgba(0, 0, 0, 0.6)',
            }}
            drawerContent={(props) => <CustomDrawerContent {...props} />}
        >
            <Drawer.Screen name="MainTabs" component={MainTabNavigator} />
        </Drawer.Navigator>
    );
};

export default DrawerNavigator;
