import { User } from './user.model.js';
import { Admin } from './admin.model.js';
import { Account } from './account.model.js';
import { Deposit } from './deposit.model.js';
import { Role } from './role.model.js';
import { UserRole } from './user-role.model.js';
import { UserProfile } from './user-profile.model.js';
import { UserEmail } from './user-email.model.js';
import { UserPasswordReset } from './user-password-reset.model.js';

// Admin - Role (Many-to-Many - assuming Admin also has roles, if not just default)
Admin.belongsToMany(Role, { through: 'admin_roles', foreignKey: 'adminId', as: 'roles' });
Role.belongsToMany(Admin, { through: 'admin_roles', foreignKey: 'roleId', as: 'admins' });

// User Relationships
User.hasOne(UserProfile, { foreignKey: 'userId', as: 'profile' });
UserProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(Account, { foreignKey: 'userId', as: 'account' });
Account.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Many-to-Many User <-> Role (through UserRole)
User.belongsToMany(Role, { through: UserRole, foreignKey: 'userId', as: 'roles' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'roleId', as: 'users' });

// Email & Password Reset
User.hasMany(UserEmail, { foreignKey: 'userId', as: 'emails' });
UserEmail.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(UserPasswordReset, { foreignKey: 'userId', as: 'passwordResets' });
UserPasswordReset.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Deposit Associations (for transaction history reporting)
Deposit.belongsTo(User, { foreignKey: 'fromClientId', as: 'sender' });
Deposit.belongsTo(User, { foreignKey: 'toClientId', as: 'recipient' });

// Optional: Inverse associations if you need to query deposits FROM a user
User.hasMany(Deposit, { foreignKey: 'fromClientId', as: 'sentDeposits' });
User.hasMany(Deposit, { foreignKey: 'toClientId', as: 'receivedDeposits' });

export { 
    Admin,
    User, 
    Account, 
    Deposit,
    Role, 
    UserRole, 
    UserProfile, 
    UserEmail, 
    UserPasswordReset 
};