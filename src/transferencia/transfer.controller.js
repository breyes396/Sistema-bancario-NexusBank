// ...existing code...
import mongoose from 'mongoose';
import { Account } from './account.model.js';
import { Deposit } from '../Deposit/deposit.model.js';
import { User } from '../db/models/index.js';

export const createTransfer = async (req, res) => {
    // Use Mongoose session for account updates. Note: transactions require MongoDB replica set.
    const session = await mongoose.startSession();
    try {
        // Seguridad crítica: remitente SOLO desde token validado por middleware
        const senderUserId = req.user && (req.user.id || req.user._id);
        if (!senderUserId) {
            try { await session.abortTransaction(); } catch (e) {}
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        const { toAccountNumber, amount } = req.body;
        if (!toAccountNumber || amount === undefined || amount === null) {
                try { await session.abortTransaction(); } catch (e) {}
            return res.status(400).json({ success: false, message: 'toAccountNumber y amount son requeridos' });
        }

        const parsedAmount = Number(amount);
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
                try { await session.abortTransaction(); } catch (e) {}
            return res.status(400).json({ success: false, message: 'El monto debe ser un número mayor que 0' });
        }

        // Find sender's account (Mongo)
        const senderAccount = await Account.findOne({ userId: senderUserId }).session(session);
        if (!senderAccount) {
            try { await session.abortTransaction(); } catch (e) {}
            return res.status(404).json({ success: false, message: 'Cuenta remitente no encontrada' });
        }

        // Find recipient's account by accountNumber (Mongo)
        const recipientAccount = await Account.findOne({ accountNumber: String(toAccountNumber).trim() }).session(session);
        if (!recipientAccount) {
            try { await session.abortTransaction(); } catch (e) {}
            return res.status(404).json({ success: false, message: 'Cuenta destino no encontrada' });
        }

        // Prevent transferring to the same account
        if (senderAccount.accountNumber === recipientAccount.accountNumber) {
                try { await session.abortTransaction(); } catch (e) {}
            return res.status(400).json({ success: false, message: 'No se puede transferir a la misma cuenta' });
        }

        // Check users status (active) - User is still in Postgres; this is a read-only check
        const senderUser = await User.findByPk(senderAccount.userId);
        const recipientUser = await User.findByPk(recipientAccount.userId);

        if (!senderUser || !senderUser.status) {
            try { await session.abortTransaction(); } catch (e) {}
            return res.status(403).json({ success: false, message: 'Cuenta remitente inactiva o no disponible' });
        }

        if (!recipientUser || !recipientUser.status) {
            try { await session.abortTransaction(); } catch (e) {}
            return res.status(403).json({ success: false, message: 'Cuenta destino inactiva' });
        }

        // accountBalance stored as DECIMAL may be string; coerce to number
        const senderBalance = Number(parseFloat(senderAccount.accountBalance));
        if (senderBalance < parsedAmount) {
            try { await session.abortTransaction(); } catch (e) {}
            return res.status(400).json({ success: false, message: 'Saldo insuficiente' });
        }

        // Update balances
        const newSenderBalance = Number((senderBalance - parsedAmount).toFixed(2));
        const recipientBalance = Number(parseFloat(recipientAccount.accountBalance));
        const newRecipientBalance = Number((recipientBalance + parsedAmount).toFixed(2));

        // perform updates inside the Mongo session transaction
        await session.withTransaction(async () => {
            senderAccount.accountBalance = newSenderBalance;
            recipientAccount.accountBalance = newRecipientBalance;
            await senderAccount.save({ session });
            await recipientAccount.save({ session });

            await Deposit.create([{
                fromClientId: senderAccount.userId,
                toClientId: recipientAccount.userId,
                fromAccountNumber: senderAccount.accountNumber,
                toAccountNumber: recipientAccount.accountNumber,
                amount: parsedAmount,
                type: 'transfer'
            }], { session });
        });

        return res.status(200).json({
            success: true,
            message: 'Transferencia realizada exitosamente',
            data: {
                from: { userId: senderAccount.userId, accountNumber: senderAccount.accountNumber, accountBalance: Number(newSenderBalance) },
                to: { userId: recipientAccount.userId, accountNumber: recipientAccount.accountNumber, accountBalance: Number(newRecipientBalance) },
                amount: parsedAmount,
                // transferId not available as a single shared auto-increment; Mongo will have _id if needed
                transferId: undefined
            }
        });
    } catch (error) {
        console.error('createTransfer error:', error);
        try { await session.abortTransaction(); } catch (e) { console.error('rollback error:', e); }
        return res.status(500).json({ success: false, message: 'Error interno', error: error.message });
    }
};
// ...existing code...