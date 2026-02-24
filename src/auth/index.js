
const { User } = require('./user.model');
const { Admin } = require('./admin.model');
const { Role } = require('./role.model');
const { Account } = require('./account.model');
const { Profile } = require('./profile.model');
const { UserEmail } = require('./userEmail.model');

// Aquí ya se importan y asocian los modelos en sus propios archivos
// Solo exportamos para uso global
module.exports = {
	User,
	Admin,
	Role,
	Account,
	Profile,
	UserEmail
};
