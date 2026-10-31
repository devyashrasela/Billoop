import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

export class TemplateLine extends Model {}

TemplateLine.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    templateId: {
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
    qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    unitPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    taxId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'TemplateLine',
    tableName: 'template_lines',
    timestamps: true,
    indexes: [
      { fields: ['templateId'] },
      { fields: ['productId'] },
      { fields: ['variantId'] },
      { fields: ['taxId'] },
    ],
  }
);
