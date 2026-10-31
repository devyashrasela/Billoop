import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';
import { SUBSCRIPTION_STATUS } from '../../../shared/constants/index.js';

export class Subscription extends Model {}

Subscription.init(
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
    customerId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    planId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    templateId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    paymentTermId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(SUBSCRIPTION_STATUS),
      allowNull: false,
      defaultValue: 'draft',
    },
    isPaused: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    expiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    nextBillingDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    quotationValidUntil: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    closedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    closeReason: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Subscription',
    tableName: 'subscriptions',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['number'] },
      { fields: ['status', 'nextBillingDate'] },
      { fields: ['customerId'] },
      { fields: ['planId'] },
    ],
  }
);

