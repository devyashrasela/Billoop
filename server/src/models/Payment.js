import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';
import { PAYMENT_METHODS } from '../../../shared/constants/index.js';

export class Payment extends Model {}

Payment.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    invoiceId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    method: {
      type: DataTypes.ENUM(PAYMENT_METHODS),
      allowNull: false,
      defaultValue: 'bank_transfer',
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    paidOn: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    recordedBy: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments',
    timestamps: true,
    indexes: [
      { fields: ['invoiceId'] },
      { fields: ['paidOn'] },
      { fields: ['recordedBy'] },
    ],
  }
);
