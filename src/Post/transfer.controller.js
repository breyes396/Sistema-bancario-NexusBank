const User = require('../models/client.model'); // Modelo de cliente
const Account = require('../models/account.model'); // Modelo de cuenta (ajústalo a tu base de datos)

const createTransfer = async (req, res) => {
  try {
    const { amount, destinationAccountNumber } = req.body;

    // Paso 1: Validar que la cuenta destino exista
    const destinationAccount = await Account.findOne({ accountNumber: destinationAccountNumber });
    if (!destinationAccount) {
      return res.status(404).json({ msg: 'Cuenta destino no encontrada' });
    }

    // Paso 2: Verificar que el remitente tenga suficiente saldo
    const senderAccount = await Account.findOne({ userId: req.user.id });
    if (!senderAccount) {
      return res.status(404).json({ msg: 'Cuenta remitente no encontrada' });
    }

    if (senderAccount.balance < amount) {
      return res.status(400).json({ msg: 'Saldo insuficiente' });
    }

    // Paso 3: Realizar la transferencia
    senderAccount.balance -= amount;
    destinationAccount.balance += amount;

    // Guardar las actualizaciones en la base de datos
    await senderAccount.save();
    await destinationAccount.save();

    return res.status(200).json({ msg: 'Transferencia realizada con éxito' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Error en el servidor' });
  }
};

module.exports = {
  createTransfer,
};