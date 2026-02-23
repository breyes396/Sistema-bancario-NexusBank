import { DataTypes } from 'sequelize';
import sequelize from '../../../configs/postgres-db.js';

export const UserEmail = sequelize.define('UserEmail', {
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    verificationToken: {
        type: DataTypes.STRING
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'user_emails',
    timestamps: true
});
