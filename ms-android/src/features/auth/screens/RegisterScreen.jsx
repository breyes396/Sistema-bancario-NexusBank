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
import { useRegister } from '../hooks/useRegister';
import Button from '../../../shared/components/common/Button';
import Input from '../../../shared/components/common/Input';
import { Card } from '../../../shared/components/common/Common';
import styles from './RegisterScreen.styles';

const RegisterScreen = ({ navigation }) => {
    const { form, setField, errors, apiError, successMessage, loading, submit } = useRegister();

    // Registro no inicia sesión: el backend crea una solicitud de cuenta
    // Monetaria pendiente de aprobación administrativa (ver ms-postgres
    // auth.controller.js -> AccountRequest). Al confirmar, regresamos a Login.
    useEffect(() => {
        if (!successMessage) return undefined;
        const timeout = setTimeout(() => {
            navigation.replace('Login');
        }, 3000);
        return () => clearTimeout(timeout);
    }, [successMessage, navigation]);

    const handleSubmit = () => {
        submit();
    };

    if (successMessage) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.successContainer}>
                    <View style={styles.successIconCircle}>
                        <Text style={styles.successIcon}>✓</Text>
                    </View>
                    <Text style={styles.successTitle}>¡Solicitud enviada!</Text>
                    <Text style={styles.successMessage}>{successMessage}</Text>
                    <Button title="Volver a Iniciar Sesión" onPress={() => navigation.replace('Login')} />
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
                        <Text style={styles.title}>Únete a NexusBank</Text>
                        <Text style={styles.subtitle}>
                            Completa tus datos para solicitar tu cuenta Monetaria
                        </Text>
                    </View>

                    <Input
                        label="Nombre completo"
                        placeholder="Juan Pérez García"
                        value={form.fullName}
                        onChangeText={(v) => setField('fullName', v)}
                        error={errors.fullName}
                    />

                    <Input
                        label="DPI"
                        placeholder="1234567890123"
                        value={form.documentNumber}
                        onChangeText={(v) => setField('documentNumber', v.replace(/[^0-9]/g, ''))}
                        keyboardType="number-pad"
                        maxLength={13}
                        error={errors.documentNumber}
                    />

                    <Input
                        label="Correo electrónico"
                        placeholder="juan@example.com"
                        value={form.email}
                        onChangeText={(v) => setField('email', v)}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        error={errors.email}
                    />

                    <Input
                        label="Teléfono"
                        placeholder="77778888"
                        value={form.phoneNumber}
                        onChangeText={(v) => setField('phoneNumber', v.replace(/[^0-9]/g, ''))}
                        keyboardType="number-pad"
                        maxLength={8}
                        error={errors.phoneNumber}
                    />

                    <Input
                        label="Contraseña"
                        placeholder="••••••••"
                        value={form.password}
                        onChangeText={(v) => setField('password', v)}
                        secureTextEntry
                        error={errors.password}
                    />

                    <Input
                        label="Confirmar contraseña"
                        placeholder="••••••••"
                        value={form.confirmPassword}
                        onChangeText={(v) => setField('confirmPassword', v)}
                        secureTextEntry
                        error={errors.confirmPassword}
                    />

                    <Card style={styles.infoCard}>
                        <Text style={styles.infoText}>
                            Tu cuenta se creará como <Text style={styles.infoBold}>Cuenta Monetaria</Text>{' '}
                            y quedará pendiente de aprobación administrativa.
                        </Text>
                    </Card>

                    {apiError ? (
                        <Card style={styles.errorCard}>
                            <Text style={styles.errorCardText}>{apiError}</Text>
                        </Card>
                    ) : null}

                    <Button
                        title="Solicitar cuenta"
                        onPress={handleSubmit}
                        loading={loading}
                        disabled={loading}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default RegisterScreen;
