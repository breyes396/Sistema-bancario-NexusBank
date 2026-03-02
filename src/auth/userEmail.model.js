import { DataTypes } from 'sequelize';
import sequelize from '../../configs/db.js';
import { generateEmailId } from '../../helpers/uuid-generator.js';

export const UserEmail = sequelize.define('UserEmail', {
  id: {
    type: DataTypes.STRING(16),
    primaryKey: true,
    defaultValue: () => generateEmailId()
  },
  userId: {
    type: DataTypes.STRING(16),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'user_emails',
  timestamps: true

});

