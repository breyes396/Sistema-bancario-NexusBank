import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
    accountNumber: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  // Asegúrate de que el modelo de User esté correctamente configurado
        required: true
    },
    balance: {
        type: Number,
        required: true,
        default: 0
    }
});

export const Account = mongoose.model('Account', accountSchema);