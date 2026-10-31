import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';
import { INVOICE_STATUS } from '../../../shared/constants/index.js';

export class Invoice extends Model {}

Invoice.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    subscriptionId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    customerId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    periodStart: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    periodEnd: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    issueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(INVOICE_STATUS),
      allowNull: false,
      defaultValue: 'draft',
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    discountTotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    taxTotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    amountPaid: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Invoice',
    tableName: 'invoices',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['number'] },
      { unique: true, fields: ['subscriptionId', 'periodStart'], name: 'unique_subscription_period_start' },
      { fields: ['status', 'dueDate'] },
      { fields: ['customerId', 'status'] },
      { fields: ['subscriptionId'] },
    ],
  }
);

