import { User, UserProfile, UserPasswordReset } from '../src/user/user.model.js';
import { UserEmail } from '../src/auth/userEmail.model.js';
import { Role, UserRole } from '../src/auth/role.model.js';
import { Account } from '../src/account/account.model.js';
import { Transaction } from '../src/account/transaction.model.js';
import Catalog from '../src/catalog/catalog.model.js';
import CatalogAudit from '../src/catalog/catalogAudit.model.js';

export function initializeAssociations() {
    User.hasOne(UserProfile, { 
        foreignKey: 'userId', 
        as: 'UserProfile',
        onDelete: 'CASCADE'
    });
    UserProfile.belongsTo(User, { 
        foreignKey: 'userId', 
        as: 'User' 
    });

    User.hasMany(UserEmail, { 
        foreignKey: 'userId', 
        as: 'UserEmails',
        onDelete: 'CASCADE'
    });
    UserEmail.belongsTo(User, { 
        foreignKey: 'userId', 
        as: 'User' 
    });

    User.hasOne(UserPasswordReset, {
        foreignKey: 'userId',
        as: 'UserPasswordReset',
        onDelete: 'CASCADE'
    });
    UserPasswordReset.belongsTo(User, { 
        foreignKey: 'userId', 
        as: 'User' 
    });

    User.hasMany(UserRole, { 
        foreignKey: 'userId', 
        as: 'UserRoles',
        onDelete: 'CASCADE'
    });
    UserRole.belongsTo(User, { 
        foreignKey: 'userId', 
        as: 'User' 
    });

    Role.hasMany(UserRole, { 
        foreignKey: 'roleId', 
        as: 'UserRoles',
        onDelete: 'CASCADE'
    });
    UserRole.belongsTo(Role, { 
        foreignKey: 'roleId', 
        as: 'Role' 
    });

    User.belongsToMany(Role, {
        through: UserRole,
        foreignKey: 'userId',
        otherKey: 'roleId',
        as: 'Roles'
    });
    Role.belongsToMany(User, {
        through: UserRole,
        foreignKey: 'roleId',
        otherKey: 'userId',
        as: 'Users'
    });

    User.hasMany(Account, { 
        foreignKey: 'userId', 
        as: 'Accounts',
        onDelete: 'CASCADE'
    });
    Account.belongsTo(User, { 
        foreignKey: 'userId', 
        as: 'User' 
    });

    Account.hasMany(Transaction, {
        foreignKey: 'accountId',
        as: 'Transactions',
        onDelete: 'CASCADE'
    });
    Transaction.belongsTo(Account, {
        foreignKey: 'accountId',
        as: 'Account'
    });

    // Catalog Associations
    Catalog.hasMany(CatalogAudit, {
        foreignKey: 'catalogId',
        as: 'Audits',
        onDelete: 'CASCADE'
    });
    CatalogAudit.belongsTo(Catalog, {
        foreignKey: 'catalogId',
        as: 'Catalog'
    });
}
