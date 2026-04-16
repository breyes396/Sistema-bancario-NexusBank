import { FailedTransaction } from '../src/security/failedTransaction.model.js';
import { FraudAlert } from '../src/security/fraudAlert.model.js';
import {
    sendAccountBlockedEmail,
    sendFraudAlertEmail,
    sendFailedAttemptEmail
} from './email.service.js';

const BLOCKING_THRESHOLDS = {
  failedAttempts: 3, // Bloquear después de 3 intentos fallidos
  blockingDuration: 30 * 60 * 1000, // 30 minutos
  timeWindow: 60 * 60 * 1000, // 1 hora para contar intentos
  rapidTransactionWindow: 5 * 60 * 1000, // 5 minutos
  rapidTransactionLimit: 3, // Máximo 3 transacciones en 5 minutos
  unusualAmountThreshold: 1.5 // 150% del promedio es sospechoso
};

/**
 * Registra un intento de transacción fallido
 */
export const recordFailedTransaction = async (req, userId, transactionData) => {
  try {
    const failedRecord = await FailedTransaction.create({
      userId,
      accountId: transactionData.accountId || null,
      type: transactionData.type,
      amount: transactionData.amount,
      failureReason: transactionData.reason,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: transactionData.metadata || {},
      isBlocked: false
    });

    // Verificar si se debe bloquear el usuario después de este intento
    const shouldBlock = await checkIfShouldBlock(userId);
    if (shouldBlock) {
      const blockedUntil = new Date(Date.now() + BLOCKING_THRESHOLDS.blockingDuration);
      await FailedTransaction.updateOne(
        { _id: failedRecord._id },
        { $set: { isBlocked: true, blockedUntil } }
      );

      await createFraudAlert({
        userId,
        accountId: transactionData.accountId,
        alertType: 'EXCESSIVE_FAILED_ATTEMPTS',
        severity: 'HIGH',
        description: `Usuario bloqueado tras ${BLOCKING_THRESHOLDS.failedAttempts} intentos fallidos`,
        failedAttempts: BLOCKING_THRESHOLDS.failedAttempts,
        metadata: {
          blockedUntil: blockedUntil.toISOString(),
          transactionType: transactionData.type
        }
      });

      // ====== ENVIAR EMAIL DE BLOQUEO ======
      await sendBlockingNotificationEmail(userId, blockedUntil, BLOCKING_THRESHOLDS.failedAttempts);

      return { blocked: true, blockedUntil };
    }

    // ====== ENVIAR EMAIL DE INTENTO FALLIDO ======
    const failedCount = await FailedTransaction.countDocuments({
      userId,
      createdAt: { $gte: new Date(Date.now() - BLOCKING_THRESHOLDS.timeWindow) },
      isBlocked: false
    });

    await sendFailedAttemptNotificationEmail(userId, transactionData, failedCount);

    return { blocked: false };
  } catch (error) {
    console.error('Error registrando transacción fallida:', error.message);
    return { blocked: false };
  }
};


/**
 * Verifica si un usuario tiene bloqueos activos
 */
export const isUserBlocked = async (userId) => {
  try {
    const blockedAttempt = await FailedTransaction.findOne({
      userId,
      isBlocked: true,
      blockedUntil: { $gt: new Date() }
    }).sort({ blockedUntil: -1 });

    if (blockedAttempt) {
      return {
        blocked: true,
        blockedUntil: blockedAttempt.blockedUntil,
        reason: 'Múltiples intentos fallidos'
      };
    }

    return { blocked: false };
  } catch (error) {
    console.error('Error verificando bloqueo de usuario:', error.message);
    return { blocked: false };
  }
};

/**
 * Verifica si se debe bloquear un usuario basado en intentos fallidos recientes
 */
async function checkIfShouldBlock(userId) {
  try {
    const failedCount = await FailedTransaction.countDocuments({
      userId,
      createdAt: { $gte: new Date(Date.now() - BLOCKING_THRESHOLDS.timeWindow) },
      isBlocked: false
    });

    return failedCount >= BLOCKING_THRESHOLDS.failedAttempts;
  } catch (error) {
    console.error('Error verificando intentos fallidos:', error.message);
    return false;
  }
}

/**
 * Detecta patrones sospechosos de fraude
 */
export const detectFraudPatterns = async (req, userId, transactionData) => {
  try {
    const alerts = [];

    // 1. Detectar múltiples IPs del mismo usuario
    const ipsUsed = await FailedTransaction.distinct('ipAddress', {
      userId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      ipAddress: { $ne: null }
    });

    if (ipsUsed.length > 3) {
      alerts.push({
        alertType: 'MULTIPLE_IPS',
        severity: 'MEDIUM',
        description: `Múltiples ubicaciones detectadas (${ipsUsed.length} IPs diferentes en 24h)`,
        metadata: { ipCount: ipsUsed.length }
      });
    }

    // 2. Detectar transacciones rápidas
    const recentTransactions = await FailedTransaction.countDocuments({
      userId,
      createdAt: { $gte: new Date(Date.now() - BLOCKING_THRESHOLDS.rapidTransactionWindow) }
    });

    if (recentTransactions >= BLOCKING_THRESHOLDS.rapidTransactionLimit) {
      alerts.push({
        alertType: 'RAPID_TRANSACTIONS',
        severity: 'MEDIUM',
        description: `${recentTransactions} transacciones en los últimos 5 minutos`,
        metadata: { transactionCount: recentTransactions }
      });
    }

    // 3. Detectar montos inusuales (por ahora simple, se puede mejorar)
    if (transactionData.amount > 5000) {
      alerts.push({
        alertType: 'UNUSUAL_AMOUNT',
        severity: 'LOW',
        description: `Transacción de monto elevado (Q${transactionData.amount})`,
        metadata: { amount: transactionData.amount }
      });
    }

    // Crear alertas en la base de datos y enviar emails
    for (const alert of alerts) {
      const fraudAlert = await createFraudAlert({
        userId,
        accountId: transactionData.accountId,
        ...alert
      });

      // ====== ENVIAR EMAIL DE ALERTA DE FRAUDE ======
      if (fraudAlert && alert.severity !== 'LOW') {
        // Solo enviar email para alertas MEDIUM y HIGH
        await sendFraudAlertNotificationEmail(userId, alert);
      }
    }

    return alerts;
  } catch (error) {
    console.error('Error detectando patrones de fraude:', error.message);
    return [];
  }
};

/**
 * Crea una nueva alerta de fraude
 */
export const createFraudAlert = async (alertData) => {
  try {
    return await FraudAlert.create({
      userId: alertData.userId,
      accountId: alertData.accountId || null,
      alertType: alertData.alertType,
      severity: alertData.severity || 'MEDIUM',
      description: alertData.description,
      failedAttempts: alertData.failedAttempts || null,
      metadata: alertData.metadata || {},
      status: 'ACTIVE'
    });
  } catch (error) {
    console.error('Error creando alerta de fraude:', error.message);
    return null;
  }
};

/**
 * Obtiene alertas de fraude activas de un usuario
 */
export const getUserFraudAlerts = async (userId) => {
  try {
    return await FraudAlert.find({
      userId,
      status: 'ACTIVE'
    }).sort({ severity: -1, createdAt: -1 });
  } catch (error) {
    console.error('Error obteniendo alertas de fraude:', error.message);
    return [];
  }
};

/**
 * Obtiene todos los intentos fallidos de un usuario en las últimas 24 horas
 */
export const getUserFailedAttempts = async (userId) => {
  try {
    return await FailedTransaction.find({
      userId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }).sort({ createdAt: -1 });
  } catch (error) {
    console.error('Error obteniendo intentos fallidos:', error.message);
    return [];
  }
};

/**
 * Desbloquea manualmente a un usuario (solo para admins)
 */
export const unblockUser = async (userId, adminId) => {
  try {
    await FailedTransaction.updateMany(
      {
        userId,
        isBlocked: true,
        blockedUntil: { $gt: new Date() }
      },
      {
        $set: {
          blockedUntil: new Date(),
          isBlocked: false
        }
      }
    );

    // Crear registro de alerta resuelta
    await FraudAlert.updateMany(
      {
        userId,
        alertType: 'EXCESSIVE_FAILED_ATTEMPTS',
        status: 'ACTIVE'
      },
      {
        $set: {
          status: 'RESOLVED',
          reviewedBy: adminId,
          reviewedAt: new Date()
        }
      }
    );

    return true;
  } catch (error) {
    console.error('Error desbloqueando usuario:', error.message);
    return false;
  }
};

/**
 * Resuelve una alerta de fraude
 */
export const resolveFraudAlert = async (alertId, adminId, resolution = 'RESOLVED') => {
  try {
    await FraudAlert.updateOne(
      { _id: alertId },
      {
        $set: {
          status: resolution,
          reviewedBy: adminId,
          reviewedAt: new Date()
        }
      }
    );
    return true;
  } catch (error) {
    console.error('Error resolviendo alerta de fraude:', error.message);
    return false;
  }
};

// ====== FUNCIONES AUXILIARES DE EMAIL ======

/**
 * Obtiene información del usuario para enviar emails
 */
async function getUserEmailAndName(userId) {
  return null;
}

/**
 * Envía email de bloqueo de cuenta
 */
async function sendBlockingNotificationEmail(userId, blockedUntil, failedAttempts) {
  try {
    const userInfo = await getUserEmailAndName(userId);
    if (!userInfo) return;

    await sendAccountBlockedEmail(userInfo.email, userInfo.name, {
      blockedUntil,
      failedAttempts,
      reason: 'Múltiples intentos fallidos de operaciones monetarias'
    });

    console.log(`[EMAIL] Notificación de bloqueo enviada a ${userInfo.email}`);
  } catch (error) {
    console.error('[EMAIL] Error enviando notificación de bloqueo:', error.message);
  }
}

/**
 * Envía email de intento fallido
 */
async function sendFailedAttemptNotificationEmail(userId, transactionData, attemptNumber) {
  try {
    const userInfo = await getUserEmailAndName(userId);
    if (!userInfo) return;

    // Solo enviar email cada 2 intentos fallidos para no saturar
    if (attemptNumber % 2 !== 0) return;

    await sendFailedAttemptEmail(userInfo.email, userInfo.name, {
      type: transactionData.type,
      amount: transactionData.amount,
      reason: transactionData.reason,
      advanceAttempts: attemptNumber,
      attemptNumber,
      ipAddress: transactionData.ipAddress
    });

    console.log(`[EMAIL] Notificación de intento fallido enviada a ${userInfo.email}`);
  } catch (error) {
    console.error('[EMAIL] Error enviando notificación de intento fallido:', error.message);
  }
}

/**
 * Envía email de alerta de fraude
 */
async function sendFraudAlertNotificationEmail(userId, alertData) {
  try {
    const userInfo = await getUserEmailAndName(userId);
    if (!userInfo) return;

    await sendFraudAlertEmail(userInfo.email, userInfo.name, {
      alertType: alertData.alertType,
      severity: alertData.severity,
      description: alertData.description,
      detectedAt: new Date()
    });

    console.log(`[EMAIL] Notificación de alerta de fraude enviada a ${userInfo.email}`);
  } catch (error) {
    console.error('[EMAIL] Error enviando notificación de alerta:', error.message);
  }
}

export default {
  recordFailedTransaction,
  isUserBlocked,
  detectFraudPatterns,
  createFraudAlert,
  getUserFraudAlerts,
  getUserFailedAttempts,
  unblockUser,
  resolveFraudAlert,
  BLOCKING_THRESHOLDS
};
