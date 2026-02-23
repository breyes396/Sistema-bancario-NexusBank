
// Alias para reutilizar el modelo User de auth
const { User } = require('../auth/user.model');
module.exports = { Client: User };
