import mongoose from 'mongoose';

const { Schema } = mongoose;

const AccountSchema = new Schema({
  accountNumber: { type: String, required: true, unique: true },
  accountBalance: { type: Number, required: true, default: 0.00 },
  // keep userId as Number to match existing User PKs in Postgres
  userId: { type: Number, required: true }
}, {
  collection: 'accounts',
  timestamps: true
});

export const Account = mongoose.models.Account || mongoose.model('Account', AccountSchema);
