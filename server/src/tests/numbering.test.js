import test from 'node:test';
import assert from 'node:assert/strict';
import { getNextSequenceNumber, SEQUENCE_TYPES } from '../utils/numbering.js';

test('Sequence Types configuration', () => {
  assert.equal(SEQUENCE_TYPES.SUBSCRIPTION.codePrefix, 'SUB');
  assert.equal(SEQUENCE_TYPES.SUBSCRIPTION.keyPrefix, 'subscription');
  assert.equal(SEQUENCE_TYPES.INVOICE.codePrefix, 'INV');
  assert.equal(SEQUENCE_TYPES.INVOICE.keyPrefix, 'invoice');
});

test('getNextSequenceNumber generates expected format with locked transaction', async () => {
  let storedRecord = null;

  // Mock Sequence model mimicking Sequelize findOne and create
  const mockSequenceModel = {
    async findOne({ where }) {
      if (storedRecord && storedRecord.key === where.key) {
        return storedRecord;
      }
      return null;
    },
    async create({ key, lastValue }) {
      storedRecord = {
        key,
        lastValue,
        async save() {},
      };
      return storedRecord;
    },
  };

  const mockTransaction = {
    LOCK: { UPDATE: 'UPDATE' },
  };

  const num1 = await getNextSequenceNumber({
    type: 'invoice',
    transaction: mockTransaction,
    SequenceModel: mockSequenceModel,
    year: 2026,
    padLength: 6,
  });
  assert.equal(num1, 'INV-2026-000001');

  const num2 = await getNextSequenceNumber({
    type: 'invoice',
    transaction: mockTransaction,
    SequenceModel: mockSequenceModel,
    year: 2026,
    padLength: 6,
  });
  assert.equal(num2, 'INV-2026-000002');

  const sub1 = await getNextSequenceNumber({
    type: 'subscription',
    transaction: mockTransaction,
    SequenceModel: mockSequenceModel,
    year: 2026,
    padLength: 6,
  });
  assert.equal(sub1, 'SUB-2026-000001');
});

test('getNextSequenceNumber throws if no transaction provided', async () => {
  await assert.rejects(
    async () => {
      await getNextSequenceNumber({
        type: 'invoice',
        SequenceModel: {},
      });
    },
    { message: 'A database transaction is required to generate sequence numbers safely.' }
  );
});

