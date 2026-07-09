import { FailedTransaction } from '../src/security/failedTransaction.model.js';
import { FraudAlert } from '../src/security/fraudAlert.model.js';
import {
    sendAccountBlockedEmail,
    sendFraudAlertEmail,
    sendFailedAttemptEmail
} from './email.service.js';

const BLOCKING_THRESHOLDS = {
  failedAttempts: 3, 
  blockingDuration: 30 * 60 * 1000, 
  timeWindow: 60 * 60 * 1000, 
  rapidTransactionWindow: 5 * 60 * 1000, 
  rapidTransactionLimit: 3, 
  unusualAmountThreshold: 1.5 
};

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

      await sendBlockingNotificationEmail(userId, blockedUntil, BLOCKING_THRESHOLDS.failedAttempts);

      return { blocked: true, blockedUntil };
    }

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

export const detectFraudPatterns = async (req, userId, transactionData) => {
  try {
    const alerts = [];

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

    if (transactionData.amount > 5000) {
      alerts.push({
        alertType: 'UNUSUAL_AMOUNT',
        severity: 'LOW',
        description: `Transacción de monto elevado (Q${transactionData.amount})`,
        metadata: { amount: transactionData.amount }
      });
    }

    for (const alert of alerts) {
      const fraudAlert = await createFraudAlert({
        userId,
        accountId: transactionData.accountId,
        ...alert
      });

      if (fraudAlert && alert.severity !== 'LOW') {

        await sendFraudAlertNotificationEmail(userId, alert);
      }
    }

    return alerts;
  } catch (error) {
    console.error('Error detectando patrones de fraude:', error.message);
    return [];
  }
};

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

async function getUserEmailAndName(userId) {
  return null;
}

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

async function sendFailedAttemptNotificationEmail(userId, transactionData, attemptNumber) {
  try {
    const userInfo = await getUserEmailAndName(userId);
    if (!userInfo) return;

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
