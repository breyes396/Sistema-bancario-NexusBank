
const { DataTypes } = require('sequelize');
const sequelize = require('../../configs/db');

const Admin = sequelize.define('Admin', {
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true
	},
	email: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: true
	},
	password: {
		type: DataTypes.STRING,
		allowNull: false
	},
	name: {
		type: DataTypes.STRING,
		allowNull: false
	},
	status: {
		type: DataTypes.BOOLEAN,
		defaultValue: true
	}
}, {
	tableName: 'admins',
	timestamps: true
});

// Asociación con roles (muchos a muchos)
const { Role } = require('./role.model');
Admin.belongsToMany(Role, { through: 'AdminRoles', foreignKey: 'adminId' });
Role.belongsToMany(Admin, { through: 'AdminRoles', foreignKey: 'roleId' });

module.exports = { Admin };
