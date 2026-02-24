import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const depositSchema = new Schema({
    fromClient: { 
        type: Schema.Types.ObjectId, 
        ref: 'Client', 
        required: false 
    },
    toClient: { 
        type: Schema.Types.ObjectId, 
        ref: 'Client', 
        required: true 
    },
    fromAccountNumber: { 
        type: String, 
        required: false 
    },
    toAccountNumber: { 
        type: String, 
        required: true 
    },
    amount: { 
        type: Number, 
        required: true 
    },
    type: { type: String, 
        enum: [
            'deposit', 
            'transfer', 
            'withdrawal'
        ], 
        default: 'deposit' 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
}, {
    collection: 'deposits'
});

export default model('Deposit', depositSchema);
