// ...existing code...
import { Account, User, Deposit } from '../db/models/index.js';
import sequelize from '../../configs/postgres-db.js';

export const createTransfer = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        // Seguridad crítica: remitente SOLO desde token validado por middleware
        const senderUserId = req.user && (req.user.id || req.user._id);
        if (!senderUserId) {
            await t.rollback();
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        const { toAccountNumber, amount } = req.body;
        if (!toAccountNumber || amount === undefined || amount === null) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'toAccountNumber y amount son requeridos' });
        }

        const parsedAmount = Number(amount);
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'El monto debe ser un número mayor que 0' });
        }

        // Find sender's account
        const senderAccount = await Account.findOne({ where: { userId: senderUserId }, transaction: t, lock: t.LOCK.UPDATE });
        if (!senderAccount) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Cuenta remitente no encontrada' });
        }

        // Find recipient's account by accountNumber
        const recipientAccount = await Account.findOne({ where: { accountNumber: String(toAccountNumber).trim() }, transaction: t, lock: t.LOCK.UPDATE });
        if (!recipientAccount) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Cuenta destino no encontrada' });
        }

        // Prevent transferring to the same account
        if (senderAccount.accountNumber === recipientAccount.accountNumber) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'No se puede transferir a la misma cuenta' });
        }

        // Check users status (active)
        const senderUser = await User.findByPk(senderAccount.userId, { transaction: t });
        const recipientUser = await User.findByPk(recipientAccount.userId, { transaction: t });

        if (!senderUser || !senderUser.status) {
            await t.rollback();
            return res.status(403).json({ success: false, message: 'Cuenta remitente inactiva o no disponible' });
        }

        if (!recipientUser || !recipientUser.status) {
            await t.rollback();
            return res.status(403).json({ success: false, message: 'Cuenta destino inactiva' });
        }

        // accountBalance stored as DECIMAL may be string; coerce to number
        const senderBalance = Number(parseFloat(senderAccount.accountBalance));
        if (senderBalance < parsedAmount) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'Saldo insuficiente' });
        }

        // Update balances
        const newSenderBalance = (senderBalance - parsedAmount).toFixed(2);
        const recipientBalance = Number(parseFloat(recipientAccount.accountBalance));
        const newRecipientBalance = (recipientBalance + parsedAmount).toFixed(2);

        await senderAccount.update({ accountBalance: newSenderBalance }, { transaction: t });
        await recipientAccount.update({ accountBalance: newRecipientBalance }, { transaction: t });

        // Create deposit/transfer record
        const depositRecord = await Deposit.create({
            fromClientId: senderAccount.userId,
            toClientId: recipientAccount.userId,
            fromAccountNumber: senderAccount.accountNumber,
            toAccountNumber: recipientAccount.accountNumber,
            amount: parsedAmount,
            type: 'transfer'
        }, { transaction: t });

        await t.commit();

        return res.status(200).json({
            success: true,
            message: 'Transferencia realizada exitosamente',
            data: {
                from: { userId: senderAccount.userId, accountNumber: senderAccount.accountNumber, accountBalance: Number(newSenderBalance) },
                to: { userId: recipientAccount.userId, accountNumber: recipientAccount.accountNumber, accountBalance: Number(newRecipientBalance) },
                amount: parsedAmount,
                transferId: depositRecord.id
            }
        });
    } catch (error) {
        console.error('createTransfer error:', error);
        try { await t.rollback(); } catch (e) { console.error('rollback error:', e); }
        return res.status(500).json({ success: false, message: 'Error interno', error: error.message });
    }
};
// ...existing code...