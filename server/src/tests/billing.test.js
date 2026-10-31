import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advancePeriod,
  calculatePeriodEnd,
  calculateDueDate,
} from '../services/billing.service.js';
import { computeLineTax, sumLineTaxes } from '../services/tax.service.js';
import { isDiscountActive } from '../services/discount.service.js';

test('Billing Engine - Period Date Calculations', () => {
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
