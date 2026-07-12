import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from '../shared/store/authStore';
import { COLORS } from '../shared/constants/theme';
import LoginScreen from '../features/auth/screens/LoginScreen';
import RegisterScreen from '../features/auth/screens/RegisterScreen';
import DrawerNavigator from './DrawerNavigator';
import DepositScreen from "../features/deposits/screens/DepositScreen";
import DepositSuccessScreen from "../features/deposits/screens/DepositSuccessScreen";
import AccountsListScreen from '../features/accounts/screens/AccountsListScreen';
import TransferScreen from '../features/transactions/screens/TransferScreen';
import TransferSuccessScreen from '../features/transactions/screens/TransferSuccessScreen';
import ReversionsScreen from '../features/transactions/screens/ReversionsScreen';
import FavoritesScreen from '../features/favorites/screens/FavoritesScreen';
import PromotionsScreen from '../features/promotions/screens/PromotionsScreen';
import styles from './AppNavigator.styles';

const Stack = createNativeStackNavigator();

// AuthGuard: mientras Zustand rehidrata el token persistido no se sabe si hay
// sesión activa, así que se muestra un loader antes de decidir qué stack pintar.
const AppNavigator = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const hasHydrated = useAuthStore((state) => state._hasHydrated);

    if (!hasHydrated) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {isAuthenticated ? (
                    <Stack.Group>
                        <Stack.Screen name="Main" component={DrawerNavigator} />
                        <Stack.Screen name="Deposit" component={DepositScreen} />
                        <Stack.Screen name="DepositSuccess" component={DepositSuccessScreen} />
                        <Stack.Screen name="AccountsList" component={AccountsListScreen} />
                        <Stack.Screen name="Transfer" component={TransferScreen} />
                        <Stack.Screen name="TransferSuccess" component={TransferSuccessScreen} />
                        <Stack.Screen name="Reversions" component={ReversionsScreen} />
                        <Stack.Screen name="Favorites" component={FavoritesScreen} />
                        <Stack.Screen name="Promotions" component={PromotionsScreen} />
                    </Stack.Group>
                ) : (
                    <Stack.Group>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                    </Stack.Group>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
