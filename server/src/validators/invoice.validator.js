import { z } from 'zod';
import { INVOICE_STATUS } from '../../../shared/constants/index.js';

export const invoiceIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().positive('Invoice ID must be a positive integer'),
  }),
});

export const cancelInvoiceSchema = z.object({
  params: z.object({
    id: z.coerce.number().positive(),
  }),
  body: z.object({
    reason: z.string().trim().max(255).optional().nullable(),
  }),
});

export const listInvoicesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    status: z.enum([...INVOICE_STATUS, 'overdue']).optional(),
    customerId: z.coerce.number().positive().optional(),
    subscriptionId: z.coerce.number().positive().optional(),
    q: z.string().trim().optional(),
  }),
});
