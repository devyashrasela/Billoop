import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

export class PaymentTerm extends Model {}

PaymentTerm.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    dueDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'PaymentTerm',
    tableName: 'payment_terms',
    timestamps: true,
    indexes: [
      { fields: ['name'] },
    ],
  }
);
