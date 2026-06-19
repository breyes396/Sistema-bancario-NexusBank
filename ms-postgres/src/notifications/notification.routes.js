import express from 'express';
import { verifyTokenAndGetUser } from '../../middlewares/role-middleware.js';
import Notification from './notification.model.js';

const router = express.Router();

router.get('/notifications', verifyTokenAndGetUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Usuario no autenticado' });

    const notifications = await Notification.findAll({ where: { userId }, order: [['createdAt', 'DESC']] });
    return res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al obtener notificaciones', error: error.message });
  }
});

router.put('/notifications/:id/read', verifyTokenAndGetUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    const notificationId = req.params.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    if (!notificationId) {
      return res.status(400).json({ success: false, message: 'ID de notificación inválido' });
    }

    const notification = await Notification.findByPk(notificationId);
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notificación no encontrada' });
    }

    // Comparar IDs como strings para evitar problemas de tipo
    if (String(notification.userId) !== String(userId)) {
      return res.status(403).json({ success: false, message: 'Acceso denegado' });
    }

    notification.read = true;
    await notification.save();
    
    return res.status(200).json({ success: true, data: notification });
  } catch (error) {
    console.error('Error en PUT /notifications/:id/read:', error);
    return res.status(500).json({ success: false, message: 'Error al actualizar notificación', error: error.message });
  }
});

export default router;
