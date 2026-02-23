import jwt from 'jsonwebtoken'; 
import { User } from '../models/user.model'; 

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

            
            req.user = decoded.user; 
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