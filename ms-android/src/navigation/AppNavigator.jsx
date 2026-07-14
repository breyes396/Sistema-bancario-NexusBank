import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from '../shared/store/authStore';
import { useNavigationStore } from '../shared/store/navigationStore';
import { getActiveRouteName } from '../shared/utils/navigationHelpers';
import { COLORS } from '../shared/constants/theme';
import LoginScreen from '../features/auth/screens/LoginScreen';
import RegisterScreen from '../features/auth/screens/RegisterScreen';
import DrawerNavigator from './DrawerNavigator';
import styles from './AppNavigator.styles';

const Stack = createNativeStackNavigator();

// AuthGuard: mientras Zustand rehidrata el token persistido no se sabe si hay
// sesión activa, así que se muestra un loader antes de decidir qué stack pintar.
const AppNavigator = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const hasHydrated = useAuthStore((state) => state._hasHydrated);
    const navigationRef = useNavigationContainerRef();

    if (!hasHydrated) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer
            ref={navigationRef}
            onReady={() => {
                useNavigationStore
                    .getState()
                    .setActiveRouteName(getActiveRouteName(navigationRef.getRootState()));
            }}
            onStateChange={(state) => {
                useNavigationStore.getState().setActiveRouteName(getActiveRouteName(state));
            }}
        >
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {isAuthenticated ? (
                    <Stack.Group>
                        <Stack.Screen name="Main" component={DrawerNavigator} />
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
