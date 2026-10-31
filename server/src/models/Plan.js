import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';
import { BILLING_PERIODS } from '../../../shared/constants/index.js';

export class Plan extends Model {}

Plan.init(
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
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    billingPeriod: {
      type: DataTypes.ENUM(BILLING_PERIODS),
      allowNull: false,
      defaultValue: 'monthly',
    },
    minQty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    availableFrom: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    availableTo: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    autoClose: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    allowEarlyClose: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    allowPause: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    allowRenew: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'Plan',
    tableName: 'plans',
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ['name'] },
      { fields: ['billingPeriod'] },
      { fields: ['isActive'] },
    ],
  }
);

