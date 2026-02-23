
const { DataTypes } = require('sequelize');
const sequelize = require('../../configs/db');
const { User } = require('./user.model');

const Account = sequelize.define('Account', {
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true
	},
	accountNumber: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: true
	},
	balance: {
		type: DataTypes.DECIMAL(12,2),
		defaultValue: 0.00
	},
	userId: {
		type: DataTypes.INTEGER,
		allowNull: false
	}
}, {
	tableName: 'accounts',
	timestamps: true
});

Account.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(Account, { foreignKey: 'userId' });

module.exports = { Account };
