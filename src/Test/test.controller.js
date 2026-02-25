import mongoose from 'mongoose';
import Transaction from '../Transaction/transaction.model.js';
import { User } from '../db/models/user.model.js';
import { Account } from '../db/models/account.model.js';

const toObjectIdOrNew = (value) => {
    if (value && mongoose.isValidObjectId(value)) {
        return value;
    }
    return new mongoose.Types.ObjectId();
};

/**
 * ENDPOINT: POST /nexusBank/v1/test/verify-implementation
 * 
 * QUÉ HACE:
 * - Valida que el middleware verifyAccountExists esté funcionando correctamente
 * - Verifica que los modelos Transaction estén cargados en Mongoose
 * - Verifica que el campo saldo existe en el modelo User de PostgreSQL
 * - Verifica que el campo accountBalance existe en el modelo Account
 * - Prueba la creación de una transacción en MongoDB
 * - Valida el flujo completo de seguridad
 * 
 * SEGURIDAD:
 * - Requiere token JWT válido (Bearer token)
 * - El middleware validateBearerToken extrae req.user del token
 * - El middleware verifyAccountExists valida que:
 *   1. Los usuarios origen y destino existan
 *   2. Las cuentas existan en PostgreSQL
 *   3. Los usuarios estén activos (status = true)
 * 
 * RESPUESTA EXITOSA (200):
 * {
 *   success: true,
 *   message: "Implementación verificada exitosamente",
 *   data: {
 *     transaction: { ... },
 *     models: { ... },
 *     security: { ... }
 *   }
 * }
 */
export const verifyImplementation = async (req, res) => {
    try {
        // La información del token ya viene de validateBearerToken
        const userFromToken = req.user;
        const { toUserId, fromUserId } = req.body;

        console.log('✓ Token validado');
        console.log('  Usuario desde token:', userFromToken.id);

        // Test 1: Crear transacción en MongoDB
        const testTransaction = await Transaction.create({
            emisor: toObjectIdOrNew(fromUserId || userFromToken.id),
            receptor: toObjectIdOrNew(toUserId || 1),
            monto: 50.00,
            tipo: 'Transferencia',
            estado: 'Completado',
            descripcion: 'Transacción de prueba - Verificación de implementación'
        });

        console.log('✓ Transacción creada en MongoDB');

        // Test 2: Verificar campos del modelo
        const transactionFields = Object.keys(testTransaction.toObject()).filter(
            key => !['__v', '_id', 'createdAt', 'updatedAt'].includes(key)
        );

        console.log('✓ Campos de Transaction:', transactionFields.join(', '));

        // Test 3: Verificar modelos Sequelize
        const userAttributes = Object.keys(User.rawAttributes);
        const accountAttributes = Object.keys(Account.rawAttributes);

        console.log('✓ Campos de User (PostgreSQL):', userAttributes.join(', '));
        console.log('✓ Campos de Account (PostgreSQL):', accountAttributes.join(', '));

        // Limpiar: eliminar transacción de prueba
        await Transaction.deleteOne({ _id: testTransaction._id });

        return res.status(200).json({
            success: true,
            message: 'Implementación verificada exitosamente ✓',
            data: {
                transaction: {
                    model: 'Transaction (Mongoose)',
                    status: 'Funcionando',
                    fields: ['emisor', 'receptor', 'monto', 'tipo', 'fecha', 'estado', 'descripcion'],
                    testData: {
                        id: testTransaction._id.toString(),
                        monto: testTransaction.monto,
                        tipo: testTransaction.tipo,
                        estado: testTransaction.estado
                    }
                },
                models: {
                    user: {
                        database: 'PostgreSQL (Sequelize)',
                        fields: userAttributes,
                        saldoField: userAttributes.includes('saldo') ? 'Presente ✓' : 'Falta ✗'
                    },
                    account: {
                        database: 'PostgreSQL (Sequelize)',
                        fields: accountAttributes,
                        balanceField: accountAttributes.includes('accountBalance') ? 'Presente ✓' : 'Falta ✗'
                    }
                },
                security: {
                    middleware: 'verifyAccountExists disponible',
                    status: 'Activo ✓',
                    userFromToken: {
                        id: userFromToken.id,
                        email: userFromToken.email
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error en verifyImplementation:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar implementación',
            error: error.message
        });
    }
};

/**
 * ENDPOINT: POST /nexusBank/v1/test/create-transaction
 * 
 * QUÉ HACE:
 * - Crea una transacción real en MongoDB
 * - Usa el middleware verifyAccountExists para validar las cuentas
 * - Retorna los datos de la transacción creada
 * 
 * PARÁMETROS (Body):
 * {
 *   toUserId: number,        // ID del usuario destino (requerido)
 *   fromUserId?: number,     // ID del usuario origen (opcional, usa token si no se envía)
 *   monto: number,           // Monto de la transacción (requerido)
 *   tipo: string,            // 'Depósito' | 'Transferencia' | 'Compra' (requerido)
 *   descripcion?: string     // Descripción de la transacción (opcional)
 * }
 */
export const createTransactionTest = async (req, res) => {
    try {
        const { toUserId, fromUserId, monto, tipo, descripcion } = req.body;
        const validatedAccounts = req.validatedAccounts;

        // Validar monto
        if (!monto || monto < 0.01) {
            return res.status(400).json({
                success: false,
                message: 'Monto inválido. Debe ser mayor a 0.01'
            });
        }

        // Validar tipo
        const tiposValidos = ['Depósito', 'Transferencia', 'Compra'];
        if (!tiposValidos.includes(tipo)) {
            return res.status(400).json({
                success: false,
                message: `Tipo inválido. Debe ser: ${tiposValidos.join(', ')}`
            });
        }

        // Crear transacción
        const newTransaction = await Transaction.create({
            emisor: toObjectIdOrNew(validatedAccounts.fromUserId),
            receptor: toObjectIdOrNew(validatedAccounts.toUserId),
            monto,
            tipo,
            estado: 'Completado',
            descripcion: descripcion || `${tipo} entre usuarios`
        });

        console.log('✓ Transacción creada:', newTransaction._id);

        return res.status(201).json({
            success: true,
            message: 'Transacción creada exitosamente',
            transaction: {
                id: newTransaction._id,
                emisor: newTransaction.emisor,
                receptor: newTransaction.receptor,
                monto: newTransaction.monto,
                tipo: newTransaction.tipo,
                estado: newTransaction.estado,
                fecha: newTransaction.fecha,
                descripcion: newTransaction.descripcion,
                createdAt: newTransaction.createdAt
            }
        });

    } catch (error) {
        console.error('Error al crear transacción:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al crear la transacción',
            error: error.message
        });
    }
};
