import sequelize from '../../configs/postgres-db.js';
import { Account, Deposit } from '../db/models/index.js';

const createDeposit = async (req, res) => {
    const { amount } = req.body;

    if (amount === undefined || amount === null) {
        return res.status(400).json({ success: false, message: 'Amount es requerido' });
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ success: false, message: 'El monto debe ser un número mayor que 0' });
    }

    const t = await sequelize.transaction();
    try {
        const account = await Account.findOne({ 
            where: { userId: req.user.id }, 
            transaction: t, 
            lock: t.LOCK.UPDATE 
        });
        
        if (!account) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
        }

        const currentBalance = Number(parseFloat(account.accountBalance));
        const newBalance = (currentBalance + parsedAmount).toFixed(2);

        await account.update({ accountBalance: newBalance }, { transaction: t });

        await Deposit.create({
            fromClientId: null,
            toClientId: account.userId,
            fromAccountNumber: null,
            toAccountNumber: account.accountNumber,
            amount: parsedAmount,
            type: 'deposit'
        }, { transaction: t });

        await t.commit();

        return res.status(200).json({ success: true, message: 'Depósito realizado con éxito', data: { accountNumber: account.accountNumber, accountBalance: Number(newBalance) } });
    } catch (error) {
        console.error('Error en el depósito:', error);
        try { await t.rollback(); } catch (e) { console.error('rollback error:', e); }
        return res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
    }
};

const revertDeposit = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ success: false, message: 'ID del depósito es requerido' });
    }

    const t = await sequelize.transaction();
    try {
        const deposit = await Deposit.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });

        if (!deposit) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Depósito no encontrado' });
        }

        // Verificar lógica de 5 minutos
        const depositTime = new Date(deposit.createdAt).getTime();
        const currentTime = new Date().getTime();
        const timeDiff = (currentTime - depositTime) / 1000; // Diferencia en segundos

        if (timeDiff > 300) {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'No se puede revertir el depósito: ha pasado más de 5 minutos' });
        }

        if (deposit.type === 'reverted') {
            await t.rollback();
            return res.status(400).json({ success: false, message: 'El depósito ya ha sido revertido' });
        }

        const account = await Account.findOne({
            where: { accountNumber: deposit.toAccountNumber }, 
            transaction: t, 
            lock: t.LOCK.UPDATE 
        });

        if (!account) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Cuenta destino no encontrada para reversión' });
        }

        const currentBalance = Number(parseFloat(account.accountBalance));
        const amountToRevert = Number(parseFloat(deposit.amount));
        
        if (currentBalance < amountToRevert) {
             await t.rollback();
             return res.status(400).json({ success: false, message: 'Saldo insuficiente en la cuenta para revertir el depósito' });
        }

        const newBalance = (currentBalance - amountToRevert).toFixed(2);

        await account.update({ accountBalance: newBalance }, { transaction: t });

        await deposit.update({ type: 'reverted' }, { transaction: t });

        await t.commit();

        return res.status(200).json({ 
            success: true, 
            message: 'Depósito revertido con éxito', 
            data: { 
                originalDepositId: deposit.id, 
                revertedAmount: amountToRevert,
                accountNumber: account.accountNumber, 
                currentBalance: Number(newBalance) 
            } 
        });

    } catch (error) {
        console.error('Error al revertir depósito:', error);
        try { await t.rollback(); } catch (e) { console.error('rollback error:', e); }
        return res.status(500).json({ success: false, message: 'Error en el servidor al revertir depósito', error: error.message });
    }
};

export { createDeposit, revertDeposit };