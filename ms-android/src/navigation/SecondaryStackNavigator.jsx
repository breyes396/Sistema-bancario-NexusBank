import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DepositScreen from '../features/deposits/screens/DepositScreen';
import DepositSuccessScreen from '../features/deposits/screens/DepositSuccessScreen';
import AccountsListScreen from '../features/accounts/screens/AccountsListScreen';
import TransferScreen from '../features/transactions/screens/TransferScreen';
import TransferSuccessScreen from '../features/transactions/screens/TransferSuccessScreen';
import ReversionsScreen from '../features/transactions/screens/ReversionsScreen';
import FavoritesScreen from '../features/favorites/screens/FavoritesScreen';
import PromotionsScreen from '../features/promotions/screens/PromotionsScreen';
import ProfileScreen from '../features/profile/screens/ProfileScreen';

const Stack = createNativeStackNavigator();

// Anidado dentro del Drawer (a diferencia de MainTabs, sin tab bar propia)
// para que estas pantallas puedan abrir el Drawer con navigation.dispatch(DrawerActions.openDrawer()).
const SecondaryStackNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="AccountsList" component={AccountsListScreen} />
            <Stack.Screen name="Deposit" component={DepositScreen} />
            <Stack.Screen name="DepositSuccess" component={DepositSuccessScreen} />
            <Stack.Screen name="Transfer" component={TransferScreen} />
            <Stack.Screen name="TransferSuccess" component={TransferSuccessScreen} />
            <Stack.Screen name="Reversions" component={ReversionsScreen} />
            <Stack.Screen name="Favorites" component={FavoritesScreen} />
            <Stack.Screen name="Promotions" component={PromotionsScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
        </Stack.Navigator>
    );
};

export default SecondaryStackNavigator;
