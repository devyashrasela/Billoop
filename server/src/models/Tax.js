import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';
import { TAX_TYPES } from '../../../shared/constants/index.js';

export class Tax extends Model {}

Tax.init(
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
    rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    type: {
      type: DataTypes.ENUM(TAX_TYPES),
      allowNull: false,
      defaultValue: 'percentage',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'Tax',
    tableName: 'taxes',
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ['name'] },
      { fields: ['isActive'] },
    ],
  }
);
