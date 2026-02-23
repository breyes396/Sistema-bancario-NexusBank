const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth-middleware'); // Asegúrate de usar el middleware adecuado
const TransferController = require('../controllers/transfer.controller'); // Controlador que vamos a crear más abajo

// Ruta para crear una transferencia
router.post('/transfers', authMiddleware, TransferController.createTransfer);

module.exports = router;