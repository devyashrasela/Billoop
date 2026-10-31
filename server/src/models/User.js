import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';
import { ROLES } from '../../../shared/constants/index.js';

export class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
      set(val) {
        this.setDataValue('email', val ? val.trim().toLowerCase() : val);
      },
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM(Object.values(ROLES)),
      allowNull: false,
      defaultValue: ROLES.CUSTOMER,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    resetTokenHash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    resetExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['email'] },
      { fields: ['role'] },
      { fields: ['isActive'] },
    ],
  }
);
