import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

export class InvoiceLine extends Model {}

InvoiceLine.init(
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
      allowNull: false,
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
    discountAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    taxId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    taxRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    taxAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    lineTotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
  },
  {
    sequelize,
    modelName: 'InvoiceLine',
    tableName: 'invoice_lines',
    timestamps: true,
    indexes: [
      { fields: ['invoiceId'] },
      { fields: ['productId'] },
      { fields: ['variantId'] },
      { fields: ['taxId'] },
    ],
  }
);

