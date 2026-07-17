import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useProfile } from '../hooks/useProfile';
import Button from '../../../shared/components/common/Button';
import Input from '../../../shared/components/common/Input';
import InfoModal from '../../../shared/components/common/InfoModal';
import { Card, LoadingSpinner } from '../../../shared/components/common/Common';
import HeaderMenuButton from '../../../shared/components/common/HeaderMenuButton';
import { getInitials } from '../../../shared/utils/stringHelpers';
import { BANK_DARK as BANK } from '../../../shared/constants/colors';
import styles from './ProfileScreen.styles';

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-GT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
};

const ProfileScreen = ({ navigation }) => {
    const {
        profile,
        accountUser,
        loading,
        error,
        saving,
        uploadingPhoto,
        saveProfile,
        pickAndUploadPhoto,
    } = useProfile();

    const [form, setForm] = useState(null);
    const [infoModal, setInfoModal] = useState({ visible: false, type: 'success', title: '', message: '' });

    useEffect(() => {
        if (profile) {
            setForm({
                fullName: profile.Name || '',
                username: profile.Username || '',
                address: profile.Address || '',
                jobName: profile.JobName || '',
                income: profile.Income != null ? String(profile.Income) : '',
                fraudAlerts: profile.FraudAlerts !== false,
            });
        }
    }, [profile]);

    const closeInfoModal = () => setInfoModal((prev) => ({ ...prev, visible: false }));

    const handleChangePhoto = async () => {
        try {
            await pickAndUploadPhoto();
        } catch (err) {
            setInfoModal({ visible: true, type: 'error', title: 'No se pudo actualizar la foto', message: err.message });
        }
    };

    const handleSave = async () => {
        try {
            await saveProfile({
                fullName: form.fullName.trim(),
                username: form.username.trim(),
                address: form.address.trim(),
                jobName: form.jobName.trim(),
                income: form.income ? parseFloat(form.income) : null,
                fraudAlerts: form.fraudAlerts,
            });
            setInfoModal({ visible: true, type: 'success', title: 'Listo', message: 'Tu perfil se actualizó correctamente.' });
        } catch (err) {
            setInfoModal({ visible: true, type: 'error', title: 'No se pudo actualizar', message: err.message });
        }
    };

    if (loading && !profile) {
        return (
            <SafeAreaView style={styles.safe}>
                <LoadingSpinner />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <HeaderMenuButton navigation={navigation} style={styles.backBtn} />
                    <Text style={styles.title}>Mi Perfil</Text>
                    <Text style={styles.subtitle}>Consulta y actualiza tus datos personales</Text>
                </View>

                <View style={styles.avatarSection}>
                    <TouchableOpacity
                        style={styles.avatarWrap}
                        onPress={handleChangePhoto}
                        activeOpacity={0.8}
                        disabled={uploadingPhoto}
                    >
                        {profile?.ProfilePhotoUrl ? (
                            <Image source={{ uri: profile.ProfilePhotoUrl }} style={styles.avatarImage} />
                        ) : (
                            <Text style={styles.avatarText}>{getInitials(profile?.Name)}</Text>
                        )}
                        {uploadingPhoto ? (
                            <View style={styles.avatarOverlay}>
                                <ActivityIndicator color={BANK.onPrimary} />
                            </View>
                        ) : (
                            <View style={styles.avatarBadge}>
                                <Feather name="camera" size={14} color={BANK.onPrimary} />
                            </View>
                        )}
                    </TouchableOpacity>
                    <Text style={styles.avatarHint}>Toca la foto para cambiarla</Text>
                </View>

                <Card style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Estado</Text>
                        <Text style={styles.infoValueAccent}>{profile?.Status || 'Activo'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Miembro desde</Text>
                        <Text style={styles.infoValue}>{formatDate(profile?.createdAt)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Código de usuario</Text>
                        <Text style={styles.infoValue}>USR-{accountUser?.id}</Text>
                    </View>
                </Card>

                {error ? (
                    <Card style={styles.errorCard}>
                        <Text style={styles.errorCardText}>{error}</Text>
                    </Card>
                ) : null}

                {form ? (
                    <>
                        <Input
                            label="Nombre completo"
                            value={form.fullName}
                            onChangeText={(val) => setForm((prev) => ({ ...prev, fullName: val }))}
                        />
                        <Input
                            label="Usuario"
                            value={form.username}
                            onChangeText={(val) => setForm((prev) => ({ ...prev, username: val }))}
                            autoCapitalize="none"
                        />
                        <Input label="Teléfono" value={profile?.PhoneNumber || '—'} editable={false} style={styles.inputDisabled} />
                        <Input label="Correo" value={accountUser?.email || '—'} editable={false} style={styles.inputDisabled} />
                        <Input
                            label="Dirección"
                            value={form.address}
                            onChangeText={(val) => setForm((prev) => ({ ...prev, address: val }))}
                        />
                        <Input
                            label="Trabajo"
                            value={form.jobName}
                            onChangeText={(val) => setForm((prev) => ({ ...prev, jobName: val }))}
                        />
                        <Input
                            label="Ingresos (Q)"
                            value={form.income}
                            onChangeText={(val) => setForm((prev) => ({ ...prev, income: val.replace(/[^0-9.]/g, '') }))}
                            keyboardType="decimal-pad"
                        />

                        <View style={styles.switchRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.switchLabel}>Alertas de fraude</Text>
                                <Text style={styles.switchHint}>Recibe notificaciones de actividad sospechosa</Text>
                            </View>
                            <Switch
                                value={form.fraudAlerts}
                                onValueChange={(val) => setForm((prev) => ({ ...prev, fraudAlerts: val }))}
                                trackColor={{ false: BANK.border, true: BANK.primary }}
                                thumbColor={BANK.onPrimary}
                            />
                        </View>

                        <Button
                            title="Guardar cambios"
                            onPress={handleSave}
                            loading={saving}
                            disabled={saving}
                            style={styles.saveBtn}
                        />
                    </>
                ) : null}
            </ScrollView>

            <InfoModal
                visible={infoModal.visible}
                type={infoModal.type}
                title={infoModal.title}
                message={infoModal.message}
                onClose={closeInfoModal}
            />
        </SafeAreaView>
    );
};

export default ProfileScreen;
