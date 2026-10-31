import { z } from 'zod';
import { DISCOUNT_TYPES, DISCOUNT_SCOPES } from '../../../shared/constants/index.js';

export const createDiscountSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Discount name is required').max(255),
    code: z.string().trim().max(100).optional().nullable(),
    type: z.enum(DISCOUNT_TYPES, {
      errorMap: () => ({ message: `Type must be one of: ${DISCOUNT_TYPES.join(', ')}` }),
    }).default('percent'),
    value: z.coerce.number().positive('Discount value must be greater than 0'),
    minPurchase: z.coerce.number().min(0).default(0),
    minQty: z.coerce.number().int().min(0).default(0),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'),
    usageLimit: z.coerce.number().int().positive().optional().nullable(),
    scope: z.enum(DISCOUNT_SCOPES, {
      errorMap: () => ({ message: `Scope must be one of: ${DISCOUNT_SCOPES.join(', ')}` }),
    }).default('subscription'),
    isActive: z.boolean().default(true),
    productIds: z.array(z.coerce.number().positive()).optional().default([]),
  }),
});

export const updateDiscountSchema = z.object({
  params: z.object({
    id: z.coerce.number().positive(),
  }),
  body: z.object({
    name: z.string().trim().min(1).max(255).optional(),
    code: z.string().trim().max(100).optional().nullable(),
    type: z.enum(DISCOUNT_TYPES).optional(),
    value: z.coerce.number().positive().optional(),
    minPurchase: z.coerce.number().min(0).optional(),
    minQty: z.coerce.number().int().min(0).optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    usageLimit: z.coerce.number().int().positive().optional().nullable(),
    scope: z.enum(DISCOUNT_SCOPES).optional(),
    isActive: z.boolean().optional(),
    productIds: z.array(z.coerce.number().positive()).optional(),
  }),
});

export const discountIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().positive(),
  }),
});
