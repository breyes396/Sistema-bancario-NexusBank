import { DataTypes } from 'sequelize';
import sequelize from '../../configs/db.js';
import { generateUserId, generateProfileId, generateResetId } from '../../helpers/uuid-generator.js';

export const User = sequelize.define('User', {
    id: {
        type: DataTypes.STRING(16),
        primaryKey: true,
        defaultValue: () => generateUserId()
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
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    lastLogin: {
        type: DataTypes.DATE
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isApproved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'users',
    timestamps: true
});

export const UserProfile = sequelize.define('UserProfile', {
    Id: {
        type: DataTypes.STRING(16),
        primaryKey: true,
        field: 'id',
        defaultValue: () => generateProfileId()
    },
    Name: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'name'
    },
    Username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'username'
    },
    PhoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'phoneNumber'
    },
    Address: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'address'
    },
    JobName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'jobName'
    },
    DocumentType: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'documentType'
    },
    DocumentNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'documentNumber'
    },
    Income: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'income'
    },
    UsernameUpdatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'usernameUpdatedAt'
    },
    Status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'status'
    },
    ProfilePhotoUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'profilePhotoUrl'
    },
    UserId: {
        type: DataTypes.STRING(16),
        allowNull: false,
        unique: true,
        field: 'userId'
    }
}, {
    tableName: 'user_profiles',
    timestamps: true
});

export const UserPasswordReset = sequelize.define('UserPasswordReset', {
    Id: {
        type: DataTypes.STRING(16),
        primaryKey: true,
        field: 'id',
        defaultValue: () => generateResetId()
    },
    UserId: {
        type: DataTypes.STRING(16),
        allowNull: false,
        field: 'userId'
    },
    PasswordResetToken: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'token'
    },
    PasswordResetTokenExpiry: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'expiresAt'
    }
}, {
    tableName: 'user_password_resets',
    timestamps: true
});
