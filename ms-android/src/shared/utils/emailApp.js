import { Linking } from 'react-native';

// Intenta abrir Gmail directamente (esquema propio de la app de Gmail) y si
// no está instalada/disponible, cae a la app de correo predeterminada del
// teléfono vía "mailto:". No depende de permisos nuevos ni de config nativa.
export const openEmailApp = async () => {
    try {
        await Linking.openURL('googlegmail://');
        return;
    } catch {
        // Gmail no está instalada o no pudo abrirse: seguimos con el fallback
    }

    try {
        await Linking.openURL('mailto:');
    } catch {
        throw new Error('No se encontró una aplicación de correo instalada');
    }
};
