import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

export class RefreshToken extends Model {}

RefreshToken.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    tokenHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    familyId: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'RefreshToken',
    tableName: 'refresh_tokens',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['tokenHash'] },
      { fields: ['familyId'] },
    ],
  }
);

