import { z } from 'zod';
import { BILLING_PERIODS } from '../../../shared/constants/index.js';

export const createPlanSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Plan name is required').max(255),
    price: z.coerce.number().min(0, 'Price cannot be negative').default(0),
    billingPeriod: z.enum(BILLING_PERIODS, {
      errorMap: () => ({ message: `Billing period must be one of: ${BILLING_PERIODS.join(', ')}` }),
    }).default('monthly'),
    minQty: z.coerce.number().int().min(1, 'Minimum quantity must be at least 1').default(1),
    availableFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD').optional().nullable(),
    availableTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD').optional().nullable(),
    autoClose: z.boolean().default(false),
    allowEarlyClose: z.boolean().default(true),
    allowPause: z.boolean().default(false),
    allowRenew: z.boolean().default(true),
    isActive: z.boolean().default(true),
  }),
});

export const updatePlanSchema = z.object({
  params: z.object({
    id: z.coerce.number().positive(),
  }),
  body: z.object({
    name: z.string().trim().min(1).max(255).optional(),
    price: z.coerce.number().min(0).optional(),
    billingPeriod: z.enum(BILLING_PERIODS).optional(),
    minQty: z.coerce.number().int().min(1).optional(),
    availableFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    availableTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    autoClose: z.boolean().optional(),
    allowEarlyClose: z.boolean().optional(),
    allowPause: z.boolean().optional(),
    allowRenew: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const planIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().positive(),
  }),
});
