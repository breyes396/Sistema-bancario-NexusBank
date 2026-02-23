
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('./user.model');
const { Admin } = require('./admin.model');
const { Role } = require('./role.model');
const { Op } = require('sequelize');
const config = require('../../configs/config');

// Login para cliente o admin
exports.login = async (req, res) => {
	const { email, password } = req.body;
	try {
		// Buscar primero en usuarios
		let user = await User.findOne({ where: { email } });
		let isAdmin = false;
		if (!user) {
			// Si no es usuario, buscar en admins
			user = await Admin.findOne({ where: { email } });
			isAdmin = !!user;
		}
		if (!user) {
			return res.status(400).json({ msg: 'Credenciales inválidas' });
		}
		const validPassword = await bcrypt.compare(password, user.password);
		if (!validPassword) {
			return res.status(400).json({ msg: 'Credenciales inválidas' });
		}
		// Roles (opcional)
		let roles = [];
		if (isAdmin) {
			const adminRoles = await user.getRoles();
			roles = adminRoles.map(r => r.name);
		} else {
			const userRoles = await user.getRoles ? await user.getRoles() : [];
			roles = userRoles.map(r => r.name);
		}
		// Generar JWT
		const token = jwt.sign({
			id: user.id,
			email: user.email,
			isAdmin,
			roles
		}, config.jwtSecret, { expiresIn: '8h' });
		res.json({ token, user: { id: user.id, email: user.email, isAdmin, roles } });
	} catch (err) {
		res.status(500).json({ msg: 'Error en el servidor', error: err.message });
	}
};

// Registro de cliente (no admin)
exports.register = async (req, res) => {
	const { email, password, name } = req.body;
	try {
		const exists = await User.findOne({ where: { email } });
		if (exists) {
			return res.status(400).json({ msg: 'El correo ya está registrado' });
		}
		const hash = await bcrypt.hash(password, 10);
		const user = await User.create({ email, password: hash, name });
		// Asignar rol por defecto (opcional)
		const role = await Role.findOne({ where: { name: 'cliente' } });
		if (role && user.addRole) await user.addRole(role);
		res.status(201).json({ msg: 'Usuario registrado', user: { id: user.id, email: user.email } });
	} catch (err) {
		res.status(500).json({ msg: 'Error en el servidor', error: err.message });
	}
};
