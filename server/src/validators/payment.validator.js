import { z } from 'zod';
import { PAYMENT_METHODS } from '../../../shared/constants/index.js';

export const createPaymentSchema = z.object({
  params: z.object({
    id: z.coerce.number().positive('Invoice ID must be a positive integer'),
  }),
  body: z.object({
    method: z.enum(PAYMENT_METHODS, {
      errorMap: () => ({ message: `Method must be one of: ${PAYMENT_METHODS.join(', ')}` }),
    }),
    amount: z.coerce.number().positive('Payment amount must be greater than 0'),
    paidOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Paid on date must be YYYY-MM-DD').optional(),
    note: z.string().trim().max(500).optional().nullable(),
  }),
});

export const listPaymentsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    invoiceId: z.coerce.number().positive().optional(),
    method: z.enum(PAYMENT_METHODS).optional(),
    q: z.string().trim().optional(),
  }),
});
