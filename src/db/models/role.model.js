import { DataTypes } from 'sequelize';
import sequelize from '../../../configs/postgres-db.js';

export const Role = sequelize.define('Role', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'roles',
    timestamps: true
});
