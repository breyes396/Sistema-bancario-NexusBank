import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../features/dashboard/screens/DashboardScreen';
import TransactionsScreen from '../features/transactions/screens/TransactionsScreen';
import { COLORS } from '../shared/constants/theme';

const Tab = createBottomTabNavigator();

const TabIcon = (glyph) => ({ color }) => <Text style={{ fontSize: 20, color }}>{glyph}</Text>;

const MainTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textLight,
                tabBarStyle: { borderTopColor: COLORS.border },
            }}
        >
            <Tab.Screen
                name="Inicio"
                component={DashboardScreen}
                options={{ tabBarIcon: TabIcon('🏠') }}
            />
            <Tab.Screen
                name="Historial"
                component={TransactionsScreen}
                options={{ tabBarIcon: TabIcon('📄') }}
            />
        </Tab.Navigator>
    );
};

export default MainTabNavigator;
