import { AuditLog } from '../models/index.js';

/**
 * Records an immutable audit log entry.
 *
 * @param {Object} params
 * @param {number|null} [params.actorId] - User ID who triggered the action
 * @param {string} params.entity - Entity name (e.g., 'subscription', 'staff', 'invoice')
 * @param {number} params.entityId - Primary key of the affected entity
 * @param {string} params.action - Action performed (e.g., 'created', 'updated', 'transition', 'deactivated')
 * @param {Object|null} [params.before] - State before mutation
 * @param {Object|null} [params.after] - State after mutation
 * @param {import('sequelize').Transaction} [params.transaction]
 * @returns {Promise<AuditLog>}
 */
export const recordAuditLog = async ({
  actorId = null,
  entity,
  entityId,
  action,
  before = null,
  after = null,
  transaction = null,
}) => {
  try {
    return await AuditLog.create(
      {
        actorId,
        entity,
        entityId,
        action,
        before,
        after,
        at: new Date(),
      },
      { transaction }
    );
  } catch (err) {
    // Non-blocking: audit log failure should not crash core transaction, but log error
    console.error(`[AuditLog Error] Failed to write audit record for ${entity} #${entityId}:`, err.message);
    return null;
  }
};

/**
 * Retrieves audit logs for a given entity or actor.
 */
export const listAuditLogs = async ({ entity, entityId, actorId, page = 1, limit = 20 }) => {
  const where = {};
  if (entity) where.entity = entity;
  if (entityId) where.entityId = entityId;
  if (actorId) where.actorId = actorId;

  const offset = (Number(page) - 1) * Number(limit);

  const { count, rows } = await AuditLog.findAndCountAll({
    where,
    order: [['at', 'DESC']],
    limit: Number(limit),
    offset,
  });

  return {
    data: rows,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total: count,
      totalPages: Math.ceil(count / Number(limit)),
    },
  };
};
