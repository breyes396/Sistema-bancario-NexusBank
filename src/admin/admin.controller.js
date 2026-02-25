import mongoose from 'mongoose';
import { Account } from '../transferencia/account.model.js';
import { Deposit } from '../Deposit/deposit.model.js';

const getAccountDetails = async (req, res) => {
  try {
    const { accountId } = req.params;

    let account = null;

    // If accountId looks like an ObjectId, try findById first
    if (mongoose.Types.ObjectId.isValid(accountId)) {
      account = await Account.findById(accountId).lean();
    }

    // If not found by _id, try by accountNumber
    if (!account) {
      account = await Account.findOne({ accountNumber: String(accountId).trim() }).lean();
    }

    if (!account) {
      return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
    }

    const accountNumber = account.accountNumber;

    // Get last 5 movements where this account is sender or recipient
    const movements = await Deposit.find({
      $or: [
        { fromAccountNumber: accountNumber },
        { toAccountNumber: accountNumber }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        accountNumber: account.accountNumber,
        accountBalance: Number(account.accountBalance),
        recentMovements: movements.map(m => ({
          id: m._id,
          type: m.type,
          amount: m.amount,
          fromAccountNumber: m.fromAccountNumber,
          toAccountNumber: m.toAccountNumber,
          createdAt: m.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('getAccountDetails error:', error);
    return res.status(500).json({ success: false, message: 'Error interno', error: error.message });
  }
};

export { getAccountDetails };
