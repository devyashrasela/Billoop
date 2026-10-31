import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

export class SubscriptionLine extends Model {}

SubscriptionLine.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    subscriptionId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    productId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    variantId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    unitPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    taxId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
  },
  {
    sequelize,
    modelName: 'SubscriptionLine',
    tableName: 'subscription_lines',
    timestamps: true,
    indexes: [
      { fields: ['subscriptionId'] },
      { fields: ['productId'] },
      { fields: ['variantId'] },
      { fields: ['taxId'] },
    ],
  }
);

