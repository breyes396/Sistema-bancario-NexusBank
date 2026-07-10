import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../features/dashboard/screens/DashboardScreen';
import TransactionsScreen from '../features/transactions/screens/TransactionsScreen';

const Tab = createBottomTabNavigator();

// La barra nativa se oculta porque DashboardScreen dibuja su propia barra
// inferior (diseño oscuro con 5 accesos). Las rutas siguen registradas aquí
// para que el Drawer pueda navegar a "Historial" de forma anidada.
const MainTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: { display: 'none' },
            }}
        >
            <Tab.Screen name="Inicio" component={DashboardScreen} />
            <Tab.Screen name="Historial" component={TransactionsScreen} />
        </Tab.Navigator>
    );
};

export default MainTabNavigator;
