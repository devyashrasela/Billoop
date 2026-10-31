import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPaymentSchema,
  listPaymentsQuerySchema,
} from '../validators/payment.validator.js';
import {
  cancelInvoiceSchema,
  listInvoicesQuerySchema,
} from '../validators/invoice.validator.js';
import { renderInvoiceHtml } from '../services/invoicePrint.service.js';

test('Invoice & Payment Validators - validate schemas and constraints', () => {
  // Valid payment payload
  const validPayment = createPaymentSchema.safeParse({
    params: { id: '10' },
    body: {
      method: 'bank_transfer',
      amount: 150.5,
      paidOn: '2026-06-15',
      note: 'Wire transfer ref #12345',
    },
  });
  assert.equal(validPayment.success, true);

  // Negative payment amount must fail
  const negativePayment = createPaymentSchema.safeParse({
    params: { id: '10' },
    body: {
      method: 'cash',
      amount: -50,
    },
  });
  assert.equal(negativePayment.success, false);

  // Invalid payment method must fail
  const invalidMethod = createPaymentSchema.safeParse({
    params: { id: '10' },
    body: {
      method: 'bitcoin',
      amount: 50,
    },
  });
  assert.equal(invalidMethod.success, false);

  // Valid cancel invoice schema
  const validCancel = cancelInvoiceSchema.safeParse({
    params: { id: '3' },
    body: { reason: 'Customer requested plan change before billing' },
  });
  assert.equal(validCancel.success, true);

  // List invoices query schema with overdue status
  const overdueQuery = listInvoicesQuerySchema.safeParse({
    query: { status: 'overdue', page: '2', limit: '20' },
  });
  assert.equal(overdueQuery.success, true);
});

test('Printable Invoice Service - renders compliant HTML', () => {
  const mockInvoice = {
    id: 1,
    number: 'INV-2026-000042',
    status: 'confirmed',
    issueDate: '2026-06-01',
    dueDate: '2026-06-16',
    periodStart: '2026-06-01',
    periodEnd: '2026-06-30',
    subtotal: 100.0,
    discountTotal: 10.0,
    taxTotal: 16.2,
    total: 106.2,
    amountPaid: 50.0,
    customer: {
      name: 'Acme Corp',
      company: 'Acme Industries',
      addressLine1: '123 Tech Way',
      city: 'Bangalore',
      country: 'India',
      phone: '+91 9876543210',
    },
    subscription: {
      number: 'SUB-2026-000001',
    },
    lines: [
      {
        id: 1,
        description: 'Pro Monthly Plan',
        qty: 1,
        unitPrice: 100.0,
        discountAmount: 10.0,
        taxRate: 18.0,
        taxAmount: 16.2,
        lineTotal: 106.2,
        product: { name: 'Pro Subscription' },
      },
    ],
    payments: [
      {
        id: 1,
        paidOn: '2026-06-05',
        method: 'bank_transfer',
        amount: 50.0,
        note: 'Initial deposit',
      },
    ],
  };

  const html = renderInvoiceHtml(mockInvoice);
  assert.ok(html.includes('INV-2026-000042'), 'Should contain invoice number');
  assert.ok(html.includes('Acme Corp'), 'Should contain customer name');
  assert.ok(html.includes('Pro Subscription'), 'Should contain product name');
  assert.ok(html.includes('window.print()'), 'Should contain print trigger');
  assert.ok(html.includes('Initial deposit'), 'Should contain payment note');
  assert.ok(html.includes('$56.20'), 'Should contain calculated balance due');
});
