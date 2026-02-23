
const { DataTypes } = require('sequelize');
const sequelize = require('../../configs/db');
const { User } = require('./user.model');

const Profile = sequelize.define('Profile', {
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true
	},
	userId: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	fullName: {
		type: DataTypes.STRING,
		allowNull: false
	},
	phone: {
		type: DataTypes.STRING,
		allowNull: true
	},
	address: {
		type: DataTypes.STRING,
		allowNull: true
	}
}, {
	tableName: 'profiles',
	timestamps: true
});

Profile.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(Profile, { foreignKey: 'userId' });

module.exports = { Profile };
