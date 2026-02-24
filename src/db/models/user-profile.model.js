import { DataTypes } from 'sequelize';
import sequelize from '../../../configs/postgres-db.js';

export const UserProfile = sequelize.define('UserProfile', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false
    },
    documentType: {
        type: DataTypes.STRING, // e.g., 'CC', 'TI', 'PASSPORT'
        allowNull: false
    },
    documentNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    income: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true // Optional if not all users have banking profile
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    }
}, {
    tableName: 'user_profiles',
    timestamps: true
});
