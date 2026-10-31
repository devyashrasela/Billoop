import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

export class DiscountProduct extends Model {}

DiscountProduct.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    discountId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    productId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'DiscountProduct',
    tableName: 'discount_products',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['discountId', 'productId'],
      },
      { fields: ['productId'] },
    ],
  }
);

