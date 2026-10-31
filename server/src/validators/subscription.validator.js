import { z } from 'zod';
import { SUBSCRIPTION_STATUS } from '../../../shared/constants/index.js';

export const subscriptionLineSchema = z.object({
  id: z.coerce.number().positive().optional(),
  productId: z.coerce.number().positive('Product is required'),
  variantId: z.coerce.number().positive().optional().nullable(),
  description: z.string().trim().max(255).optional().nullable(),
  qty: z.coerce.number().int().min(1, 'Quantity must be at least 1').default(1),
  unitPrice: z.coerce.number().min(0, 'Unit price cannot be negative'),
  taxId: z.coerce.number().positive().optional().nullable(),
});

export const createSubscriptionSchema = z.object({
  body: z.object({
    customerId: z.coerce.number().positive('Customer is required'),
    planId: z.coerce.number().positive('Plan is required'),
    paymentTermId: z.coerce.number().positive('Payment term is required'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD').optional().nullable(),
    lines: z.array(subscriptionLineSchema).min(1, 'At least one line item is required'),
  }),
});

export const createFromTemplateSchema = z.object({
  params: z.object({
    templateId: z.coerce.number().positive(),
  }),
  body: z.object({
    customerId: z.coerce.number().positive('Customer is required'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  }),
});

export const transitionSubscriptionSchema = z.object({
  params: z.object({
    id: z.coerce.number().positive(),
  }),
  body: z.object({
    to: z.enum(SUBSCRIPTION_STATUS, {
      errorMap: () => ({ message: `Target status must be one of: ${SUBSCRIPTION_STATUS.join(', ')}` }),
    }),
    closeReason: z.string().trim().max(255).optional().nullable(),
  }),
});

export const closeSubscriptionSchema = z.object({
  params: z.object({
    id: z.coerce.number().positive(),
  }),
  body: z.object({
    reason: z.string().trim().max(255).optional().default('Cancelled by user/staff'),
  }),
});

export const subscriptionIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().positive(),
  }),
});
