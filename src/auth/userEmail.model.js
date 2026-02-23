
const { DataTypes } = require('sequelize');
const sequelize = require('../../configs/db');
const { User } = require('./user.model');

const UserEmail = sequelize.define('UserEmail', {
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true
	},
	userId: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	email: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: true
	},
	verified: {
		type: DataTypes.BOOLEAN,
		defaultValue: false
	}
}, {
	tableName: 'user_emails',
	timestamps: true
});

UserEmail.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(UserEmail, { foreignKey: 'userId' });

module.exports = { UserEmail };
