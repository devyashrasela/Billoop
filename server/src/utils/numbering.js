/**
 * Gap-free, race-safe document numbering generator.
 * Uses the Sequence table with row locking (SELECT ... FOR UPDATE)
 * inside a database transaction.
 *
 * Formats:
 * - Subscriptions: SUB-YYYY-###### (e.g., SUB-2026-000001)
 * - Invoices:      INV-YYYY-###### (e.g., INV-2026-000001)
 */

export const SEQUENCE_TYPES = {
  SUBSCRIPTION: {
    keyPrefix: 'subscription',
    codePrefix: 'SUB',
  },
  INVOICE: {
    keyPrefix: 'invoice',
    codePrefix: 'INV',
  },
};

/**
 * Generates the next sequence number within a transaction.
 *
 * @param {Object} params
 * @param {'subscription'|'invoice'} params.type
 * @param {import('sequelize').Transaction} params.transaction
 * @param {import('sequelize').Model} params.SequenceModel
 * @param {number} [params.year] - Defaults to current UTC year
 * @param {number} [params.padLength=6] - Defaults to 6 digits
 * @returns {Promise<string>} e.g. "INV-2026-000001"
 */
export const getNextSequenceNumber = async ({
  type,
  transaction,
  SequenceModel,
  year = new Date().getUTCFullYear(),
  padLength = 6,
}) => {
  if (!transaction) {
    throw new Error('A database transaction is required to generate sequence numbers safely.');
  }

  const config = SEQUENCE_TYPES[type?.toUpperCase()];
  if (!config) {
    throw new Error(`Unknown sequence type: ${type}. Expected 'subscription' or 'invoice'.`);
  }

  const sequenceKey = `${config.keyPrefix}-${year}`;

  // Find and lock the sequence row for this year/type
  let seq = await SequenceModel.findOne({
    where: { key: sequenceKey },
    lock: transaction.LOCK.UPDATE,
    transaction,
  });

  if (!seq) {
    // If not exists yet for this year, create it initialized to 0
    seq = await SequenceModel.create(
      { key: sequenceKey, lastValue: 0 },
      { transaction }
    );

    // Re-lock
    seq = await SequenceModel.findOne({
      where: { key: sequenceKey },
      lock: transaction.LOCK.UPDATE,
      transaction,
    });
  }

  const nextVal = (seq.lastValue || 0) + 1;
  seq.lastValue = nextVal;
  await seq.save({ transaction });

  const paddedNum = String(nextVal).padStart(padLength, '0');
  return `${config.codePrefix}-${year}-${paddedNum}`;
};

