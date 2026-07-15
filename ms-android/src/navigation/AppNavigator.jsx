import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from '../shared/store/authStore';
import { useNavigationStore } from '../shared/store/navigationStore';
import { useProfileStore } from '../shared/store/profileStore';
import { getActiveRouteName } from '../shared/utils/navigationHelpers';
import userClient from '../shared/api/userClient';
import { BANK_DARK as BANK } from '../shared/constants/colors';
import LoginScreen from '../features/auth/screens/LoginScreen';
import RegisterScreen from '../features/auth/screens/RegisterScreen';
import DrawerNavigator from './DrawerNavigator';
import IntroScreen from './IntroScreen';
import styles from './AppNavigator.styles';

const Stack = createNativeStackNavigator();

// AuthGuard: mientras Zustand rehidrata el token persistido no se sabe si hay
// sesión activa, así que se muestra un loader antes de decidir qué stack pintar.
const AppNavigator = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const hasHydrated = useAuthStore((state) => state._hasHydrated);
    const navigationRef = useNavigationContainerRef();
    const [showIntro, setShowIntro] = useState(true);

    // Precarga la foto y el nombre actualizado del perfil una vez al iniciar
    // sesión para que el header y el drawer los muestren sin tener que abrir
    // la pantalla de Perfil (por si se editaron en una sesión anterior).
    useEffect(() => {
        if (!isAuthenticated) {
            useProfileStore.getState().setPhotoUrl(null);
            return;
        }
        userClient
            .get('/auth/profile')
            .then((response) => {
                const profile = response.data?.profile || {};
                useProfileStore.getState().setPhotoUrl(profile.ProfilePhotoUrl || null);
                if (profile.Name || profile.Username) {
                    useAuthStore.getState().updateUser({ name: profile.Name, username: profile.Username });
                }
            })
            .catch(() => {});
    }, [isAuthenticated]);

    if (showIntro) {
        return <IntroScreen onFinish={() => setShowIntro(false)} />;
    }

    if (!hasHydrated) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={BANK.accent} />
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
