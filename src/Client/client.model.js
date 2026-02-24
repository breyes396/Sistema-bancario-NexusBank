
import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'El nombre es obligatorio']
    },
    email: {
        type: String,
        required: [true, 'El correo es obligatorio'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria']
    },
    phone: {
        type: String,
        required: [true, 'El teléfono es obligatorio']
    },
    address: {
        type: String,
        required: [true, 'La dirección es obligatoria']
    },
    income: {
        type: Number,
        required: [true, 'Los ingresos mensuales son obligatorios'],
        min: [100, 'Los ingresos deben ser mayores o iguales a 100']
    },
    documentType: {
        type: String,
        required: [true, 'El tipo de documento es obligatorio'],
        enum: ['DPI', 'PASAPORTE'] 
    },
    documentNumber: {
        type: String,
        required: [true, 'El número de documento es obligatorio'],
        unique: true
    },
    accountNumber: {
        type: String,
        unique: true
    },
    status: {
        type: Boolean,
        default: true
    }
}, {
    versionKey: false,
    timestamps: true
});

clientSchema.methods.toJSON = function () {
    const { __v, password, _id, ...client } = this.toObject();
    client.uid = _id;
    return client;
}

export default mongoose.model('Client', clientSchema);
