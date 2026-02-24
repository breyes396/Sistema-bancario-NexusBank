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
        const account = await Account.findOne({ where: { userId: req.user.id }, transaction: t, lock: t.LOCK.UPDATE });
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

export { createDeposit };