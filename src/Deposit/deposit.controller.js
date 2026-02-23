import mongoose from 'mongoose';
import { Account } from '../models/account.model.js';

const createDeposit = async (req, res) => {
    const { amount } = req.body;

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const account = await Account.findOne({ userId: req.user.id }).session(session);
        if (!account) {
            await session.abortTransaction(); 
            return res.status(404).json({ msg: 'Cuenta no encontrada' });
        }

        account.balance += amount;  

        await account.save({ session });

        await session.commitTransaction();

        return res.status(200).json({ msg: 'Depósito realizado con éxito' });

    } catch (error) {
        await session.abortTransaction();
        console.error('Error en el depósito:', error);
        return res.status(500).json({ msg: 'Error en el servidor' });
    } finally {
        session.endSession();
    }
};

export { createDeposit };