import test from 'node:test';
import assert from 'node:assert/strict';
import * as models from '../models/index.js';

test('Models Registry - all 20 models exported and initialized', () => {
  const expectedModels = [
    'User',
    'RefreshToken',
    'Customer',
    'AuditLog',
    'Sequence',
    'Product',
    'ProductVariant',
    'Plan',
    'Tax',
    'PaymentTerm',
    'QuotationTemplate',
    'TemplateLine',
    'Discount',
    'DiscountProduct',
    'SubscriptionDiscount',
    'Subscription',
    'SubscriptionLine',
    'Invoice',
    'InvoiceLine',
    'Payment',
  ];

  for (const modelName of expectedModels) {
    assert.ok(models[modelName], `Model ${modelName} should be exported from index.js`);
    assert.equal(typeof models[modelName], 'function', `Model ${modelName} should be a class/function`);
    assert.ok(models[modelName].tableName, `Model ${modelName} should have a defined tableName`);
  }
});

test('Models Registry - key associations are configured', () => {
  const { User, Customer, Subscription, Invoice, Product } = models;

  assert.ok(User.associations.customer, 'User should have customer association');
  assert.ok(Customer.associations.subscriptions, 'Customer should have subscriptions association');
  assert.ok(Subscription.associations.invoices, 'Subscription should have invoices association');
  assert.ok(Subscription.associations.lines, 'Subscription should have lines association');
  assert.ok(Invoice.associations.lines, 'Invoice should have lines association');
  assert.ok(Invoice.associations.payments, 'Invoice should have payments association');
  assert.ok(Product.associations.variants, 'Product should have variants association');
});
