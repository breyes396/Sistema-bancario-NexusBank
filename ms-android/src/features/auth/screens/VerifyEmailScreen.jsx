import React, { useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVerifyEmail } from '../hooks/useVerifyEmail';
import Button from '../../../shared/components/common/Button';
import Input from '../../../shared/components/common/Input';
import { Card } from '../../../shared/components/common/Common';
import styles from './VerifyEmailScreen.styles';

// Igual que VerificationForm.jsx de la web (token pegado a mano, POST
// /auth/verify-email), más el botón de reenviar código que el backend ya
// soportaba (/auth/resend-verification) pero la web nunca llegó a exponer.
const VerifyEmailScreen = ({ navigation, route }) => {
    const {
        token,
        setToken,
        email,
        setEmail,
        error,
        loading,
        verified,
        resending,
        resendMessage,
        submit,
        resendVerification,
    } = useVerifyEmail(route?.params?.email || '');

    useEffect(() => {
        if (!verified) return undefined;
        const timeout = setTimeout(() => {
            navigation.replace('Login');
        }, 2000);
        return () => clearTimeout(timeout);
    }, [verified, navigation]);

    if (verified) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.successContainer}>
                    <View style={styles.successIconCircle}>
                        <Text style={styles.successIcon}>✓</Text>
                    </View>
                    <Text style={styles.successTitle}>¡Email verificado!</Text>
                    <Text style={styles.successMessage}>
                        Tu correo se verificó correctamente. Te llevamos al inicio de sesión.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

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
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <Text style={styles.backText}>← Volver</Text>
                        </TouchableOpacity>
                        <Text style={styles.title}>Verifica tu Email</Text>
                        <Text style={styles.subtitle}>
                            Te hemos enviado un código de verificación a tu correo. Ingrésalo para
                            completar tu registro.
                        </Text>
                    </View>

                    <Card style={styles.infoCard}>
                        <Text style={styles.infoText}>El token es válido por 24 horas.</Text>
                    </Card>

                    <Input
                        label="Token de verificación"
                        placeholder="Pega el token aquí"
                        value={token}
                        onChangeText={setToken}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    {error ? (
                        <Card style={styles.errorCard}>
                            <Text style={styles.errorCardText}>{error}</Text>
                        </Card>
                    ) : null}

                    {resendMessage ? (
                        <Card style={styles.successCard}>
                            <Text style={styles.successCardText}>{resendMessage}</Text>
                        </Card>
                    ) : null}

                    <Button
                        title="Verificar Email"
                        onPress={submit}
                        loading={loading}
                        disabled={loading}
                    />

                    <Input
                        label="¿No te llegó el código? Ingresa tu correo"
                        placeholder="usuario@correo.com"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                    />

                    <Button
                        title="Reenviar código"
                        onPress={resendVerification}
                        loading={resending}
                        disabled={resending}
                        variant="secondary"
                        style={styles.resendBtn}
                    />

                    <TouchableOpacity
                        style={styles.switchLink}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.switchText}>
                            ¿Ya verificaste tu email? <Text style={styles.switchTextBold}>Inicia sesión</Text>
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default VerifyEmailScreen;
