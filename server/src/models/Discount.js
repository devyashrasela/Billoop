import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';
import { DISCOUNT_TYPES, DISCOUNT_SCOPES } from '../../../shared/constants/index.js';

export class Discount extends Model {}

Discount.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
    },
    type: {
      type: DataTypes.ENUM(DISCOUNT_TYPES),
      allowNull: false,
      defaultValue: 'percent',
    },
    value: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    minPurchase: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0.0,
    },
    minQty: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    usageLimit: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    usedCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    scope: {
      type: DataTypes.ENUM(DISCOUNT_SCOPES),
      allowNull: false,
      defaultValue: 'subscription',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'Discount',
    tableName: 'discounts',
    timestamps: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['code'] },
      { fields: ['isActive', 'startDate', 'endDate'] },
      { fields: ['scope'] },
    ],
  }
);

