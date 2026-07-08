import React from 'react';
import {
    View,
    Text,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    SafeAreaView,
} from 'react-native';
import { useLogin } from '../hooks/useLogin';
import Button from '../../../shared/components/common/Button';
import Input from '../../../shared/components/common/Input';
import { Card } from '../../../shared/components/common/Common';
import styles from './LoginScreen.styles';

const LoginScreen = ({ navigation }) => {
    const {
        emailOrUsername,
        setEmailOrUsername,
        password,
        setPassword,
        errors,
        apiError,
        loading,
        submit,
    } = useLogin();

    // On success, useAuthStore.isAuthenticated flips to true and AppNavigator
    // swaps the stack to the authenticated area automatically.
    const handleSubmit = () => {
        submit();
    };

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.brand}>
                        <View style={styles.logoCircle}>
                            <Text style={styles.logoText}>NB</Text>
                        </View>
                        <Text style={styles.brandTitle}>NexusBank</Text>
                        <Text style={styles.brandSubtitle}>Ingresa a tu cuenta</Text>
                    </View>

                    <Input
                        label="Correo o usuario"
                        placeholder="usuario@correo.com"
                        value={emailOrUsername}
                        onChangeText={setEmailOrUsername}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        error={errors.emailOrUsername}
                    />

                    <Input
                        label="Contraseña"
                        placeholder="••••••••"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        error={errors.password}
                    />

                    {apiError ? (
                        <Card style={styles.errorCard}>
                            <Text style={styles.errorCardText}>{apiError}</Text>
                        </Card>
                    ) : null}

                    <Button
                        title="Ingresar"
                        onPress={handleSubmit}
                        loading={loading}
                        disabled={loading}
                    />

                    <TouchableOpacity
                        style={styles.switchLink}
                        onPress={() => navigation.navigate('Register')}
                    >
                        <Text style={styles.switchText}>
                            ¿No tienes cuenta? <Text style={styles.switchTextBold}>Regístrate</Text>
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default LoginScreen;
