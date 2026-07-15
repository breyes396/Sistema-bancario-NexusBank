import { create } from 'zustand';

// Estado en memoria (no persistido) para que la foto de perfil se refleje al
// instante en el header y el drawer sin tener que recargar cada pantalla.
export const useProfileStore = create((set) => ({
    photoUrl: null,
    setPhotoUrl: (photoUrl) => set({ photoUrl }),
}));
