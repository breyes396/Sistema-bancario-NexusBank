import mongoose from 'mongoose';

const { Schema } = mongoose;

const DepositSchema = new Schema({
  fromClientId: { type: Number, required: false, default: null },
  toClientId: { type: Number, required: true },
  fromAccountNumber: { type: String, required: false, default: null },
  toAccountNumber: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, required: true, default: 'deposit' }
}, {
  collection: 'deposits',
  timestamps: true
});

export const Deposit = mongoose.models.Deposit || mongoose.model('Deposit', DepositSchema);


