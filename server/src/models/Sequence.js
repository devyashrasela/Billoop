import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

export class Sequence extends Model {}

Sequence.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    lastValue: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'Sequence',
    tableName: 'sequences',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['key'] },
    ],
  }
);
