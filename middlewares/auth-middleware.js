import jwt from 'jsonwebtoken'; 
import { User } from '../src/db/models/user.model.js';
import { Account } from '../src/db/models/account.model.js'; 

export const validateBearerToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Token de autenticación no proporcionado'
            });
        }

        const tokenParts = authHeader.split(' '); 
        if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
            return res.status(401).json({
                success: false,
                message: 'Formato de token inválido. Use: Bearer <token>'
            });
        }

        const token = tokenParts[1];

        if (!token || token.trim() === '') {
            return res.status(401).json({
                success: false,
                message: 'Token vacío o inválido'
            });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    success: false,
                    message: 'Token no válido'
                });
            }

            // Guardar token y normalizar user para compatibilidad con distintos payloads
            // Algunos tokens llevan payload en { user: { id, email, role } } y otros en { id, email, role }
            req.token = token;
            req.user = (decoded && decoded.user) ? decoded.user : decoded;

            next();
        });
    } catch (error) {
        console.error('Error en validación de token:', error);
        return res.status(401).json({
            success: false,
            message: 'Error al validar el token de autenticación'
        });
    }
};

export const validateBearerTokenSelective = (publicPaths = []) => {
    return (req, res, next) => {
        const isPublicPath = publicPaths.some(path => {
            if (path instanceof RegExp) {
                return path.test(req.path);
            }
            return req.path === path || req.path.startsWith(path);
        });

        if (isPublicPath) {
            return next();
        }

        validateBearerToken(req, res, next);
    };
};

/**
 * Middleware global para verificar que las cuentas origen y destino existan y estén activas
 * Extrae userId del token JWT y valida:
 * 1. El usuario origen existe y está activo (si se proporciona)
 * 2. El usuario destino existe y está activo
 * 3. Ambas cuentas existen en la BD
 * 
 * Debe ser usado después de validateBearerToken para tener acceso a req.user
 */
export const verifyAccountExists = async (req, res, next) => {
    try {
        // Extraer información del token (debe venir de validateBearerToken)
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no identificado. Por favor, autentícate primero.'
            });
        }

        const userIdFromToken = req.user.id;

        // Obtener IDs de usuarios desde el body (para transacciones)
        // El endpoint puede enviar: fromUserId, toUserId, senderUserId, recipientUserId, etc.
        const fromUserId = req.body.fromUserId || req.body.senderUserId || userIdFromToken;
        const toUserId = req.body.toUserId || req.body.recipientUserId;

        // Validar que al menos exista usuario destino
        if (!toUserId) {
            return res.status(400).json({
                success: false,
                message: 'El usuario destino es requerido (toUserId o recipientUserId)'
            });
        }

        // Validar que usuario origen y destino sean diferentes
        if (fromUserId && toUserId && fromUserId === toUserId) {
            return res.status(400).json({
                success: false,
                message: 'El usuario origen y destino no pueden ser iguales'
            });
        }

        // Variables para almacenar los resultados de las validaciones
        let fromUser = null;
        let fromAccount = null;

        // Verificar que el usuario origen existe y está activo
        if (fromUserId) {
            fromUser = await User.findByPk(fromUserId);
            if (!fromUser) {
                return res.status(404).json({
                    success: false,
                    message: `Usuario origen con ID ${fromUserId} no encontrado`
                });
            }

            if (!fromUser.status) {
                return res.status(403).json({
                    success: false,
                    message: 'La cuenta del usuario origen está desactivada'
                });
            }

            // Verificar que la cuenta origen existe
            fromAccount = await Account.findOne({ where: { userId: fromUserId } });
            if (!fromAccount) {
                return res.status(404).json({
                    success: false,
                    message: `Cuenta bancaria no encontrada para el usuario origen (ID: ${fromUserId})`
                });
            }
        }

        // Verificar que el usuario destino existe y está activo
        const toUser = await User.findByPk(toUserId);
        if (!toUser) {
            return res.status(404).json({
                success: false,
                message: `Usuario destino con ID ${toUserId} no encontrado`
            });
        }

        if (!toUser.status) {
            return res.status(403).json({
                success: false,
                message: 'La cuenta del usuario destino está desactivada'
            });
        }

        // Verificar que la cuenta destino existe
        const toAccount = await Account.findOne({ where: { userId: toUserId } });
        if (!toAccount) {
            return res.status(404).json({
                success: false,
                message: `Cuenta bancaria no encontrada para el usuario destino (ID: ${toUserId})`
            });
        }

        // Pasar información de cuentas validadas al siguiente middleware/controlador
        req.validatedAccounts = {
            fromUserId,
            toUserId,
            fromUser: fromUser ? { id: fromUser.id, email: fromUser.email, status: fromUser.status } : null,
            toUser: { id: toUser.id, email: toUser.email, status: toUser.status },
            fromAccount: fromAccount ? { accountNumber: fromAccount.accountNumber, accountBalance: fromAccount.accountBalance } : null,
            toAccount: { accountNumber: toAccount.accountNumber, accountBalance: toAccount.accountBalance }
        };

        next();
    } catch (error) {
        console.error('Error en verifyAccountExists:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar las cuentas',
            error: error.message
        });
    }
};