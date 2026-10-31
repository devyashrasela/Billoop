import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';

export class AuditLog extends Model {}

AuditLog.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    actorId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    entity: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    entityId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    before: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    after: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    timestamps: false,
    indexes: [
      { fields: ['entity', 'entityId'] },
      { fields: ['actorId'] },
      { fields: ['at'] },
    ],
  }
);
