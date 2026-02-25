import mongoose from 'mongoose';
import { Account } from '../transferencia/account.model.js';
import { Deposit } from './deposit.model.js';

const createDeposit = async (req, res) => {
    const { amount } = req.body;

    if (amount === undefined || amount === null) {
        return res.status(400).json({ success: false, message: 'Amount es requerido' });
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ success: false, message: 'El monto debe ser un número mayor que 0' });
    }

    // Use Mongoose session/transaction. NOTE: MongoDB transactions require a replica set.
    const session = await mongoose.startSession();
    try {
        let resultData = null;
        await session.withTransaction(async () => {
            const account = await Account.findOne({ userId: req.user.id }).session(session);
            if (!account) {
                throw { status: 404, message: 'Cuenta no encontrada' };
            }

            const currentBalance = Number(account.accountBalance || 0);
            const newBalance = Number((currentBalance + parsedAmount).toFixed(2));

            account.accountBalance = newBalance;
            await account.save({ session });

            await Deposit.create([{ 
                fromClientId: null,
                toClientId: account.userId,
                fromAccountNumber: null,
                toAccountNumber: account.accountNumber,
                amount: parsedAmount,
                type: 'deposit'
            }], { session });

            resultData = { accountNumber: account.accountNumber, accountBalance: newBalance };
        });

        return res.status(200).json({ success: true, message: 'Depósito realizado con éxito', data: resultData });
    } catch (error) {
        console.error('Error en el depósito:', error);
        if (error && error.status) {
            return res.status(error.status).json({ success: false, message: error.message });
        }
        return res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message || String(error) });
    } finally {
        session.endSession();
    }
};

const revertDeposit = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ success: false, message: 'ID del depósito es requerido' });
    }

    const session = await mongoose.startSession();
    try {
        let resultData = null;
        await session.withTransaction(async () => {
            const deposit = await Deposit.findById(id).session(session);

            if (!deposit) {
                throw { status: 404, message: 'Depósito no encontrado' };
            }

            // Verificar lógica de 5 minutos
            const depositTime = new Date(deposit.createdAt).getTime();
            const currentTime = new Date().getTime();
            const timeDiff = (currentTime - depositTime) / 1000; // Diferencia en segundos

            if (timeDiff > 300) {
                throw { status: 400, message: 'No se puede revertir el depósito: ha pasado más de 5 minutos' };
            }

            if (deposit.type === 'reverted') {
                throw { status: 400, message: 'El depósito ya ha sido revertido' };
            }

            const account = await Account.findOne({ accountNumber: deposit.toAccountNumber }).session(session);

            if (!account) {
                throw { status: 404, message: 'Cuenta destino no encontrada para reversión' };
            }

            const currentBalance = Number(account.accountBalance || 0);
            const amountToRevert = Number(deposit.amount || 0);

            if (currentBalance < amountToRevert) {
                throw { status: 400, message: 'Saldo insuficiente en la cuenta para revertir el depósito' };
            }

            const newBalance = Number((currentBalance - amountToRevert).toFixed(2));

            account.accountBalance = newBalance;
            await account.save({ session });

            deposit.type = 'reverted';
            await deposit.save({ session });

            resultData = {
                originalDepositId: deposit._id,
                revertedAmount: amountToRevert,
                accountNumber: account.accountNumber,
                currentBalance: Number(newBalance)
            };
        });

        return res.status(200).json({ success: true, message: 'Depósito revertido con éxito', data: resultData });
    } catch (error) {
        console.error('Error al revertir depósito:', error);
        if (error && error.status) {
            return res.status(error.status).json({ success: false, message: error.message });
        }
        return res.status(500).json({ success: false, message: 'Error en el servidor al revertir depósito', error: error.message || String(error) });
    } finally {
        session.endSession();
    }
};

export { createDeposit, revertDeposit };