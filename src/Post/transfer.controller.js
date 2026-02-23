import mongoose from 'mongoose';
import { Account } from '../models/account.model.js';

const createTransfer = async (req, res) => {
    const { amount, destinationAccountNumber } = req.body;

    const session = await mongoose.startSession();
    
    try {
        session.startTransaction();

        const destinationAccount = await Account.findOne({ accountNumber: destinationAccountNumber }).session(session);
        if (!destinationAccount) {
            await session.abortTransaction(); 
            return res.status(404).json({ msg: 'Cuenta destino no encontrada' });
        }

        const senderAccount = await Account.findOne({ userId: req.user.id }).session(session);
        if (!senderAccount) {
            await session.abortTransaction(); 
            return res.status(404).json({ msg: 'Cuenta remitente no encontrada' });
        }

        if (senderAccount.balance < amount) {
            await session.abortTransaction();
            return res.status(400).json({ msg: 'Saldo insuficiente' });
        }

        senderAccount.balance -= amount;  
        destinationAccount.balance += amount;

        await senderAccount.save({ session });
        await destinationAccount.save({ session });

        await session.commitTransaction();  

        return res.status(200).json({ msg: 'Transferencia realizada con éxito' });

    } catch (error) {
        await session.abortTransaction();
        console.error('Error en la transferencia:', error);
        return res.status(500).json({ msg: 'Error en el servidor' });
    } finally {
        session.endSession();
    }
};

export { createTransfer };