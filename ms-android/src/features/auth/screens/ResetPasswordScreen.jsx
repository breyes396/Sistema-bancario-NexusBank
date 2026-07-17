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
import { useResetPassword } from '../hooks/useResetPassword';
import Button from '../../../shared/components/common/Button';
import Input from '../../../shared/components/common/Input';
import { Card } from '../../../shared/components/common/Common';
import styles from './ResetPasswordScreen.styles';

const ResetPasswordScreen = ({ navigation, route }) => {
    const {
        token,
        setToken,
        password,
        setPassword,
        confirmPassword,
        setConfirmPassword,
        errors,
        apiError,
        loading,
        success,
        submit,
    } = useResetPassword();

    // Si viene desde "Ya tengo mi código" con el correo a la mano, no hay
    // token real que prellenar (la app no recibe el enlace del correo), pero
    // dejamos el hook listo por si en el futuro se agrega deep link.
    useEffect(() => {
        if (route?.params?.token) {
            setToken(route.params.token);
        }
    }, [route?.params?.token]);

    useEffect(() => {
        if (!success) return undefined;
        const timeout = setTimeout(() => {
            navigation.replace('Login');
        }, 2000);
        return () => clearTimeout(timeout);
    }, [success, navigation]);

    if (success) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.container}>
                    <Text style={styles.title}>¡Contraseña restablecida!</Text>
                    <Text style={styles.subtitle}>
                        Tu contraseña se actualizó correctamente. Te llevamos al inicio de sesión.
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
                        <Text style={styles.title}>Restablecer contraseña</Text>
                        <Text style={styles.subtitle}>Elige una nueva contraseña para tu cuenta</Text>
                    </View>

                    <Input
                        label="Token de recuperación"
                        placeholder="Pega aquí el token de tu correo"
                        value={token}
                        onChangeText={setToken}
                        autoCapitalize="none"
                        autoCorrect={false}
                        error={errors.token}
                    />
                    <Text style={styles.hint}>
                        Revisa el correo que te enviamos y copia el token que aparece ahí.
                    </Text>

                    <Input
                        label="Nueva contraseña"
                        placeholder="••••••••"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        error={errors.password}
                    />

                    <Input
                        label="Confirmar contraseña"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        error={errors.confirmPassword}
                    />

                    {apiError ? (
                        <Card style={styles.errorCard}>
                            <Text style={styles.errorCardText}>{apiError}</Text>
                        </Card>
                    ) : null}

                    <Button
                        title="Restablecer contraseña"
                        onPress={submit}
                        loading={loading}
                        disabled={loading}
                    />

                    <TouchableOpacity
                        style={styles.switchLink}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.switchText}>
                            <Text style={styles.switchTextBold}>Volver a Iniciar sesión</Text>
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ResetPasswordScreen;
