import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toCents,
  fromCents,
  formatMoney,
  addMoney,
  subtractMoney,
  multiplyMoney,
  calculateTax,
  calculateDiscount,
} from '../utils/money.js';

test('Money Utilities - toCents & fromCents', () => {
  assert.equal(toCents(10.5), 1050);
  assert.equal(toCents('19.99'), 1999);
  assert.equal(toCents(0.1 + 0.2), 30); // binary float precision safety
  assert.equal(fromCents(1050), 10.5);
  assert.equal(fromCents(1999), 19.99);
  assert.equal(formatMoney(10.5), '10.50');
  assert.equal(formatMoney('0'), '0.00');
});

test('Money Utilities - arithmetic', () => {
  assert.equal(addMoney(0.1, 0.2), 0.3);
  assert.equal(addMoney(10.25, 5.75, 1.01), 17.01);
  assert.equal(subtractMoney(10.0, 3.25), 6.75);
  assert.equal(multiplyMoney(19.99, 3), 59.97);
});

test('Money Utilities - calculateTax', () => {
  // Percentage tax: 18% on 100 = 18.00
  assert.equal(
    calculateTax({ amount: 100, rate: 18, type: 'percentage' }),
    18.0
  );

  // Percentage tax with discount: 18% on (100 - 20) = 14.40
  assert.equal(
    calculateTax({ amount: 100, discount: 20, rate: 18, type: 'percentage' }),
    14.4
  );

  // Fixed tax: 5 per unit, qty = 3 => 15.00
  assert.equal(
    calculateTax({ amount: 100, rate: 5, type: 'fixed', qty: 3 }),
    15.0
  );
});

test('Money Utilities - calculateDiscount', () => {
  // Percent discount: 10% on 100 = 10
  assert.equal(
    calculateDiscount({ baseAmount: 100, value: 10, type: 'percent' }),
    10.0
  );

  // Fixed discount: 25 on 100 = 25
  assert.equal(
    calculateDiscount({ baseAmount: 100, value: 25, type: 'fixed' }),
    25.0
  );

  // Discount cannot exceed base amount
  assert.equal(
    calculateDiscount({ baseAmount: 30, value: 50, type: 'fixed' }),
    30.0
  );
  assert.equal(
    calculateDiscount({ baseAmount: 30, value: 150, type: 'percent' }),
    30.0
  );
});

