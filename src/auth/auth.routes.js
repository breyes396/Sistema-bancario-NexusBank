
const express = require('express');
const router = express.Router();
const authCtrl = require('./auth.controller');

// Login (cliente o admin)
router.post('/login', authCtrl.login);

// Registro de cliente
router.post('/register', authCtrl.register);

module.exports = router;
