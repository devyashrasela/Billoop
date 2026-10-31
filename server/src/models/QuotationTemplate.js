import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

export class QuotationTemplate extends Model {}

QuotationTemplate.init(
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
    planId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    validityDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
    },
    paymentTermId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'QuotationTemplate',
    tableName: 'quotation_templates',
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ['name'] },
      { fields: ['planId'] },
      { fields: ['paymentTermId'] },
      { fields: ['isActive'] },
    ],
  }
);

