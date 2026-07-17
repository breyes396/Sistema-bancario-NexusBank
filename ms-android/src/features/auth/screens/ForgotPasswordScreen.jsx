import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForgotPassword } from '../hooks/useForgotPassword';
import { openEmailApp } from '../../../shared/utils/emailApp';
import Button from '../../../shared/components/common/Button';
import Input from '../../../shared/components/common/Input';
import { Card } from '../../../shared/components/common/Common';
import styles from './ForgotPasswordScreen.styles';

const REDIRECT_SECONDS = 5;

// Mismo flujo que ForgotPasswordPage.jsx de la web: un solo campo de correo,
// el backend siempre responde con el mismo mensaje genérico exista o no la
// cuenta, y tras enviarlo se cuenta regresivo hacia Login. Se agrega un
// botón para abrir la app de correo directamente (no existe en la web).
const ForgotPasswordScreen = ({ navigation }) => {
    const { email, setEmail, error, loading, sent, submit } = useForgotPassword();
    const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

    useEffect(() => {
        if (!sent) return undefined;
        if (countdown <= 0) {
            navigation.replace('Login');
            return undefined;
        }
        const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [sent, countdown, navigation]);

    const handleOpenEmailApp = async () => {
        try {
            await openEmailApp();
        } catch (err) {
            Alert.alert('No se pudo abrir el correo', err.message);
        }
    };

    if (sent) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.successContainer}>
                    <View style={styles.successIconCircle}>
                        <Text style={styles.successIcon}>✓</Text>
                    </View>
                    <Text style={styles.successTitle}>Correo enviado</Text>
                    <Text style={styles.successMessage}>
                        Te enviamos un correo con el enlace para restablecer tu contraseña.
                        Revisa tu bandeja y abre el enlace para crear tu nueva contraseña.
                    </Text>
                    <Text style={styles.countdownText}>
                        Serás redirigido al inicio de sesión en {countdown}s.
                    </Text>

                    <Button
                        title="Abrir Gmail / Correo"
                        onPress={handleOpenEmailApp}
                        style={styles.fullWidthBtn}
                    />
                    <Button
                        title="Ya tengo mi código"
                        onPress={() => navigation.navigate('ResetPassword')}
                        variant="secondary"
                        style={styles.fullWidthBtn}
                    />
                    <Button
                        title="Ir ahora al login"
                        onPress={() => navigation.replace('Login')}
                        variant="secondary"
                        style={styles.fullWidthBtn}
                    />
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
                        <Text style={styles.title}>Recuperar contraseña</Text>
                        <Text style={styles.subtitle}>
                            Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
                        </Text>
                    </View>

                    <Input
                        label="Correo electrónico"
                        placeholder="usuario@correo.com"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        error={error}
                    />

                    <Button
                        title="Enviar correo de recuperación"
                        onPress={submit}
                        loading={loading}
                        disabled={loading}
                    />

                    <TouchableOpacity
                        style={styles.switchLink}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.switchText}>
                            ¿Ya tienes tu enlace? <Text style={styles.switchTextBold}>Iniciar sesión</Text>
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ForgotPasswordScreen;
