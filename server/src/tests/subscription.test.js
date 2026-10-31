import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSubscriptionSchema,
  transitionSubscriptionSchema,
  subscriptionLineSchema,
} from '../validators/subscription.validator.js';

test('Subscription Schemas - validate line items and transition payload', () => {
  // Valid line item
  const validLine = subscriptionLineSchema.safeParse({
    productId: 1,
    variantId: null,
    qty: 2,
    unitPrice: 99.99,
  });
  assert.equal(validLine.success, true);

  // Line item with negative price must fail
  const negativePrice = subscriptionLineSchema.safeParse({
    productId: 1,
    qty: 1,
    unitPrice: -10,
  });
  assert.equal(negativePrice.success, false);

  // Valid create subscription payload
  const validCreate = createSubscriptionSchema.safeParse({
    body: {
      customerId: 1,
      planId: 2,
      paymentTermId: 1,
      startDate: '2026-06-01',
      lines: [
        {
          productId: 1,
          qty: 1,
          unitPrice: 50,
        },
      ],
    },
  });
  assert.equal(validCreate.success, true);

  // Invalid create subscription without lines
  const invalidCreate = createSubscriptionSchema.safeParse({
    body: {
      customerId: 1,
      planId: 2,
      paymentTermId: 1,
      lines: [],
    },
  });
  assert.equal(invalidCreate.success, false);

  // Valid transition
  const validTransition = transitionSubscriptionSchema.safeParse({
    params: { id: '5' },
    body: { to: 'confirmed' },
  });
  assert.equal(validTransition.success, true);

  // Invalid transition status
  const invalidTransition = transitionSubscriptionSchema.safeParse({
    params: { id: '5' },
    body: { to: 'invalid_status' },
  });
  assert.equal(invalidTransition.success, false);
});
