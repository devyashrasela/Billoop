import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeToMRR } from '../services/dashboard.service.js';

test('Dashboard Service - MRR Normalization for all Billing Periods', () => {
  // Monthly is 1:1
  assert.equal(normalizeToMRR(150, 'monthly'), 150);

  // Daily normalized to ~30 days
  assert.equal(normalizeToMRR(5, 'daily'), 150);

  // Weekly normalized to 52/12 weeks
  assert.equal(normalizeToMRR(100, 'weekly'), 433.33);

  // Yearly normalized to 12 months
  assert.equal(normalizeToMRR(1200, 'yearly'), 100);
  assert.equal(normalizeToMRR(600, 'yearly'), 50);

  // Default or zero
  assert.equal(normalizeToMRR(0, 'monthly'), 0);
  assert.equal(normalizeToMRR(null, 'monthly'), 0);
});
