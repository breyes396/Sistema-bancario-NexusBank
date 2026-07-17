import { useState, useEffect, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import userClient from '../../../shared/api/userClient';
import { useProfileStore } from '../../../shared/store/profileStore';
import { useAuthStore } from '../../../shared/store/authStore';

export const useProfile = () => {
    const [profile, setProfile] = useState(null);
    const [accountUser, setAccountUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    const setPhotoUrl = useProfileStore((state) => state.setPhotoUrl);
    const updateUser = useAuthStore((state) => state.updateUser);

    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await userClient.get('/auth/profile');
            const data = response.data || {};
            setProfile(data.profile || {});
            setAccountUser(data.user || null);
            setPhotoUrl(data.profile?.ProfilePhotoUrl || null);
            if (data.profile?.Name || data.profile?.Username) {
                updateUser({ name: data.profile.Name, username: data.profile.Username });
            }
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.msg || 'Error al cargar el perfil');
        } finally {
            setLoading(false);
        }
    }, [setPhotoUrl, updateUser]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const saveProfile = async (fields) => {
        setSaving(true);
        setError(null);
        try {
            const response = await userClient.put('/profile/edit', fields);
            const updatedProfile = response.data?.data?.profile;
            if (updatedProfile) {
                setProfile(updatedProfile);
                setPhotoUrl(updatedProfile.ProfilePhotoUrl || null);
                updateUser({ name: updatedProfile.Name, username: updatedProfile.Username });
            }
            return response.data;
        } catch (err) {
            const message = err.response?.data?.msg || err.response?.data?.message || 'No se pudo actualizar el perfil';
            setError(message);
            throw new Error(message);
        } finally {
            setSaving(false);
        }
    };

    const pickAndUploadPhoto = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            throw new Error('Necesitas dar permiso para acceder a tus fotos');
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (result.canceled || !result.assets?.[0]) return null;

        const asset = result.assets[0];
        setUploadingPhoto(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('photo', {
                uri: asset.uri,
                name: asset.fileName || `profile_${Date.now()}.jpg`,
                type: asset.mimeType || 'image/jpeg',
            });

            const response = await userClient.post('/auth/profile/photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const photoUrl = response.data?.data?.photoUrl || null;
            if (photoUrl) {
                setProfile((prev) => ({ ...(prev || {}), ProfilePhotoUrl: photoUrl }));
                setPhotoUrl(photoUrl);
            }
            return photoUrl;
        } catch (err) {
            const message = err.response?.data?.msg || err.response?.data?.message || 'No se pudo subir la foto';
            setError(message);
            throw new Error(message);
        } finally {
            setUploadingPhoto(false);
        }
    };

    return {
        profile,
        accountUser,
        loading,
        error,
        saving,
        uploadingPhoto,
        refetch: fetchProfile,
        saveProfile,
        pickAndUploadPhoto,
    };
};
