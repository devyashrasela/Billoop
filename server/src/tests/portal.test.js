import test from 'node:test';
import assert from 'node:assert/strict';
import {
  updatePortalProfileSchema,
  portalCloseSubSchema,
  portalIdParamSchema,
} from '../validators/portal.validator.js';

test('Portal Validators - profile update, param ID, and self-service cancellation', () => {
  // Valid profile update
  const validProfile = updatePortalProfileSchema.safeParse({
    body: {
      name: 'John Doe',
      company: 'Acme Software',
      phone: '+1 555-1234',
      taxId: 'US-TAX-9988',
      city: 'San Francisco',
      country: 'USA',
    },
  });
  assert.equal(validProfile.success, true);

  // Profile update with empty name must fail
  const emptyName = updatePortalProfileSchema.safeParse({
    body: {
      name: '   ',
    },
  });
  assert.equal(emptyName.success, false);

  // Valid self-service cancellation reason
  const validClose = portalCloseSubSchema.safeParse({
    params: { id: '7' },
    body: { reason: 'No longer need this service' },
  });
  assert.equal(validClose.success, true);
  assert.equal(validClose.data.body.reason, 'No longer need this service');

  // Default close reason if omitted
  const defaultClose = portalCloseSubSchema.safeParse({
    params: { id: '7' },
    body: {},
  });
  assert.equal(defaultClose.success, true);
  assert.ok(defaultClose.data.body.reason.includes('Cancelled by customer'));

  // Valid ID param
  const validId = portalIdParamSchema.safeParse({
    params: { id: '42' },
  });
  assert.equal(validId.success, true);

  // Invalid ID param
  const invalidId = portalIdParamSchema.safeParse({
    params: { id: 'abc' },
  });
  assert.equal(invalidId.success, false);
});
