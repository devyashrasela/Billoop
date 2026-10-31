import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advancePeriod,
  calculatePeriodEnd,
  calculateDueDate,
  runBillingSweep,
} from '../services/billing.service.js';
import { Op } from 'sequelize';
import { sequelize, Subscription, Invoice, InvoiceLine, Sequence, Discount } from '../models/index.js';
import { computeLineTax, sumLineTaxes } from '../services/tax.service.js';
import { isDiscountActive } from '../services/discount.service.js';

test('Billing Engine - Period Date Calculations', () => {
  assert.equal(advancePeriod('2026-01-31', 'monthly'), '2026-02-28');
  assert.equal(advancePeriod('2024-01-31', 'monthly'), '2024-02-29');
  assert.equal(advancePeriod('2026-03-31', 'monthly'), '2026-04-30');
  assert.equal(advancePeriod('2026-12-31', 'monthly'), '2027-01-31');
  assert.equal(advancePeriod('2024-02-29', 'yearly'), '2025-02-28');
  assert.equal(advancePeriod('2026-01-31'), '2026-02-28');
  assert.equal(calculatePeriodEnd('2026-01-31', 'monthly'), '2026-02-27');
  // Monthly advance
  assert.equal(advancePeriod('2026-01-15', 'monthly'), '2026-02-15');
  assert.equal(calculatePeriodEnd('2026-01-15', 'monthly'), '2026-02-14');

  // Weekly advance
  assert.equal(advancePeriod('2026-03-01', 'weekly'), '2026-03-08');
  assert.equal(calculatePeriodEnd('2026-03-01', 'weekly'), '2026-03-07');

  // Daily advance
  assert.equal(advancePeriod('2026-05-10', 'daily'), '2026-05-11');
  assert.equal(calculatePeriodEnd('2026-05-10', 'daily'), '2026-05-10');

  // Yearly advance
  assert.equal(advancePeriod('2026-01-01', 'yearly'), '2027-01-01');
  assert.equal(calculatePeriodEnd('2026-01-01', 'yearly'), '2026-12-31');

  // Due date with payment terms
  assert.equal(calculateDueDate('2026-06-01', 0), '2026-06-01'); // Immediate
  assert.equal(calculateDueDate('2026-06-01', 15), '2026-06-16'); // Net 15
  assert.equal(calculateDueDate('2026-06-01', 30), '2026-07-01'); // Net 30
});

test('Billing sweep processes every due subscription as the result set shrinks', async (t) => {
  const subscriptions = Array.from({ length: 400 }, (_, i) => ({
    id: (i + 1) * 2,
    number: `SUB-${i + 1}`,
    status: 'active',
    isPaused: false,
    nextBillingDate: '2026-01-31',
    plan: { billingPeriod: 'monthly' },
    lines: [],
    async save() {},
  }));
  const billedIds = [];
  t.mock.method(sequelize, 'transaction', async (callback) => callback({ LOCK: { UPDATE: 'UPDATE' } }));
  t.mock.method(Subscription, 'findAll', async ({ where, limit, offset = 0 }) =>
    subscriptions.filter((sub) => sub.nextBillingDate <= where.nextBillingDate[Op.lte]
      && sub.id > (where.id?.[Op.gt] ?? 0)).slice(offset, offset + limit));
  t.mock.method(Subscription, 'findByPk', async (id) => subscriptions.find((sub) => sub.id === id));
  t.mock.method(Discount, 'findAll', async () => []);
  t.mock.method(Sequence, 'findOne', async () => ({ lastValue: 0, async save() {} }));
  t.mock.method(Invoice, 'create', async (data) => {
    billedIds.push(data.subscriptionId);
    return { id: billedIds.length, ...data };
  });
  t.mock.method(InvoiceLine, 'bulkCreate', async () => []);

  const result = await runBillingSweep({ todayStr: '2026-01-31' });
  assert.equal(result.processed, 400);
  assert.equal(result.invoicesGenerated, 400);
  assert.deepEqual(result.failed, []);
  assert.equal(new Set(billedIds).size, 400);
  assert.ok(subscriptions.every((sub) => sub.nextBillingDate === '2026-02-28'));
});

test('Billing Engine - Tax Service Calculation', () => {
  // Percentage tax: 18% on $200 pre-tax with $50 discount => 18% of $150 = $27.00
  const lineTaxPercent = computeLineTax({
    amount: 200,
    discount: 50,
    tax: { id: 1, rate: 18, type: 'percentage' },
  });
  assert.equal(lineTaxPercent.taxAmount, 27.0);
  assert.equal(lineTaxPercent.taxRate, 18);
  assert.equal(lineTaxPercent.taxId, 1);

  // Fixed tax: $5 flat fee per unit, qty = 4 => $20.00
  const lineTaxFixed = computeLineTax({
    amount: 500,
    discount: 0,
    tax: { id: 2, rate: 5, type: 'fixed' },
    qty: 4,
  });
  assert.equal(lineTaxFixed.taxAmount, 20.0);

  // Sum line taxes
  const totalTax = sumLineTaxes([lineTaxPercent, lineTaxFixed]);
  assert.equal(totalTax, 47.0);
});

test('Billing Engine - Discount Active Eligibility Checks', () => {
  const activeDiscount = {
    isActive: true,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    usageLimit: 100,
    usedCount: 25,
  };
  assert.equal(isDiscountActive(activeDiscount, '2026-06-15'), true);

  // Inactive discount
  assert.equal(isDiscountActive({ ...activeDiscount, isActive: false }, '2026-06-15'), false);

  // Expired discount
  assert.equal(isDiscountActive(activeDiscount, '2027-01-01'), false);

  // Future discount
  assert.equal(isDiscountActive(activeDiscount, '2025-12-31'), false);

  // Exhausted usage limit
  assert.equal(isDiscountActive({ ...activeDiscount, usedCount: 100 }, '2026-06-15'), false);
});
