import Notification from '../src/notifications/notification.model.js';
import { User, UserProfile } from '../src/user/user.model.js';
import { sendAccountBlockedEmail, sendFraudAlertEmail } from './email.service.js';

/**
 * Servicio centralizado para enviar alertas de fraude tanto por email (si está activo)
 * como por notificaciones dentro de la aplicación.
 */
export const sendFraudAlert = async (userId, alertData) => {
  const { title, message, emailType, emailData } = alertData;

  try {
    console.log(`[NOTIFICATION] Creando notificación para usuario ${userId}: ${title}`);
    // 1. Siempre crear notificación en la app
    const notif = await Notification.create({
      userId,
      title: title || 'Alerta de Seguridad',
      message: message,
      metadata: { ...emailData, alertType: emailType }
    });
    console.log(`[NOTIFICATION] Notificación creada con ID: ${notif.id}`);

    // 2. Buscar al usuario y su preferencia de alertas
    const user = await User.findByPk(userId, {
      include: [{ model: UserProfile, as: 'UserProfile' }]
    });

    if (!user) return;

    // 3. Si tiene las alertas activadas, enviar correo
    if (user.UserProfile && user.UserProfile.FraudAlerts !== false) {
      console.log(`[NOTIFICATION] Alertas activas. Enviando correo a ${user.email}`);
      const email = user.email;
      const name = user.UserProfile.Name || 'Usuario';

      if (emailType === 'BLOCK') {
        await sendAccountBlockedEmail(email, name, emailData);
      } else if (emailType === 'FRAUD') {
        await sendFraudAlertEmail(email, name, emailData);
      }
    }
  } catch (error) {
    console.error('Error en sendFraudAlert:', error.message);
  }
};

export default {
  sendFraudAlert
};
