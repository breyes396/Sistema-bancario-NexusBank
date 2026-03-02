import { User, UserProfile, UserPasswordReset } from '../src/user/user.model.js';
import { UserEmail } from '../src/auth/userEmail.model.js';
import { Role, UserRole } from '../src/auth/role.model.js';
import { Account } from '../src/account/account.model.js';
import { Transaction } from '../src/account/transaction.model.js';
import { TransactionAudit } from '../src/account/transactionAudit.model.js';
import { FailedTransaction } from '../src/account/failedTransaction.model.js';
import { FraudAlert } from '../src/account/fraudAlert.model.js';
import { AccountBlockHistory } from '../src/account/accountBlockHistory.model.js';

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

    Transaction.hasMany(TransactionAudit, {
        foreignKey: 'transactionId',
        as: 'Audits',
        onDelete: 'CASCADE'
    });
    TransactionAudit.belongsTo(Transaction, {
        foreignKey: 'transactionId',
        as: 'Transaction'
    });

    // Failed Transactions Associations (Security)
    User.hasMany(FailedTransaction, {
        foreignKey: 'userId',
        as: 'FailedTransactions',
        onDelete: 'CASCADE'
    });
    FailedTransaction.belongsTo(User, {
        foreignKey: 'userId',
        as: 'User'
    });

    Account.hasMany(FailedTransaction, {
        foreignKey: 'accountId',
        as: 'FailedTransactions',
        onDelete: 'CASCADE'
    });
    FailedTransaction.belongsTo(Account, {
        foreignKey: 'accountId',
        as: 'Account'
    });

    // Fraud Alerts Associations (Advanced Security)
    User.hasMany(FraudAlert, {
        foreignKey: 'userId',
        as: 'FraudAlerts',
        onDelete: 'CASCADE'
    });
    FraudAlert.belongsTo(User, {
        foreignKey: 'userId',
        as: 'User'
    });

    Account.hasMany(FraudAlert, {
        foreignKey: 'accountId',
        as: 'FraudAlerts',
        onDelete: 'CASCADE'
    });
    FraudAlert.belongsTo(Account, {
        foreignKey: 'accountId',
        as: 'Account'
    });

    // Account Block History Associations (T46)
    Account.hasMany(AccountBlockHistory, {
        foreignKey: 'accountId',
        as: 'BlockHistory',
        onDelete: 'CASCADE'
    });
    AccountBlockHistory.belongsTo(Account, {
        foreignKey: 'accountId',
        as: 'Account'
    });

    User.hasMany(AccountBlockHistory, {
        foreignKey: 'performedBy',
        as: 'PerformedBlockActions',
        onDelete: 'CASCADE'
    });
    AccountBlockHistory.belongsTo(User, {
        foreignKey: 'performedBy',
        as: 'performer'
    });
}
