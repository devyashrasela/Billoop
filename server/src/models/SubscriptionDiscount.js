import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

export class SubscriptionDiscount extends Model {}

SubscriptionDiscount.init(
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
    discountId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'SubscriptionDiscount',
    tableName: 'subscription_discounts',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['subscriptionId', 'discountId'],
      },
      { fields: ['discountId'] },
    ],
  }
);

