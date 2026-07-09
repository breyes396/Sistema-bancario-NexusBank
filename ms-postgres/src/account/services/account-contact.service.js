import { User, UserProfile } from '../../user/user.model.js';

export const getUserEmailAndName = async (userId) => {
    try {
        if (!userId) return null;
        const user = await User.findByPk(userId, { attributes: ['id', 'email'] });
        if (!user?.email) return null;

        const profile = await UserProfile.findOne({
            where: { UserId: userId },
            attributes: ['Name', 'Username']
        });

        return {
            email: user.email,
            name: profile?.Name || profile?.Username || user.email
        };
    } catch (error) {
        console.error('Error al obtener información del usuario para email:', error.message);
        return null;
    }
};

export const sendEmailSafe = async (sendFn) => {
    try {
        // Enviar email de forma asincrónica sin esperar (fire and forget)
        sendFn().catch(error => {
            console.error('Error enviando alerta por email:', error.message);
        });
    } catch (error) {
        console.error('Error en sendEmailSafe:', error.message);
    }
};
