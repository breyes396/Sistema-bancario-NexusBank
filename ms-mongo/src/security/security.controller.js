import { sendError, sendSuccess } from '../../helpers/response.js';
import { ERROR_CODES } from '../../helpers/error-catalog.js';
import fraudDetectionService from '../../services/fraud-detection.service.js';

export const getUserSecurityStatus = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return sendError(res, {
                status: 401,
                code: ERROR_CODES.AUTH_REQUIRED,
                message: 'Usuario no autenticado'
            });
        }

        const [blockedStatus, failedAttempts, alerts] = await Promise.all([
            fraudDetectionService.isUserBlocked(userId),
            fraudDetectionService.getUserFailedAttempts(userId),
            fraudDetectionService.getUserFraudAlerts(userId)
        ]);

        return sendSuccess(res, {
            status: 200,
            message: 'Estado de seguridad consultado exitosamente',
            data: {
                blocked: blockedStatus.blocked,
                blockedUntil: blockedStatus.blockedUntil || null,
                blockReason: blockedStatus.reason || null,
                failedAttemptsLast24h: failedAttempts.length,
                activeAlerts: alerts.length
            }
        });
    } catch (error) {
        return sendError(res, {
            status: 500,
            code: ERROR_CODES.INTERNAL_ERROR,
            message: 'Error obteniendo estado de seguridad',
            details: error.message
        });
    }
};

export const getFailedAttempts = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return sendError(res, {
                status: 401,
                code: ERROR_CODES.AUTH_REQUIRED,
                message: 'Usuario no autenticado'
            });
        }

        const attempts = await fraudDetectionService.getUserFailedAttempts(userId);

        return sendSuccess(res, {
            status: 200,
            message: 'Intentos fallidos obtenidos exitosamente',
            data: {
                attempts,
                total: attempts.length
            }
        });
    } catch (error) {
        return sendError(res, {
            status: 500,
            code: ERROR_CODES.INTERNAL_ERROR,
            message: 'Error obteniendo intentos fallidos',
            details: error.message
        });
    }
};

export const getFraudAlerts = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return sendError(res, {
                status: 401,
                code: ERROR_CODES.AUTH_REQUIRED,
                message: 'Usuario no autenticado'
            });
        }

        const alerts = await fraudDetectionService.getUserFraudAlerts(userId);

        return sendSuccess(res, {
            status: 200,
            message: 'Alertas de fraude obtenidas exitosamente',
            data: {
                alerts,
                total: alerts.length
            }
        });
    } catch (error) {
        return sendError(res, {
            status: 500,
            code: ERROR_CODES.INTERNAL_ERROR,
            message: 'Error obteniendo alertas de fraude',
            details: error.message
        });
    }
};
