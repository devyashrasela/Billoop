import { z } from 'zod';
import { TAX_TYPES } from '../../../shared/constants/index.js';

export const createTaxSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Tax name is required').max(100),
    rate: z.coerce.number().min(0, 'Tax rate cannot be negative'),
    type: z.enum(TAX_TYPES, {
      errorMap: () => ({ message: `Type must be one of: ${TAX_TYPES.join(', ')}` }),
    }).default('percentage'),
    isActive: z.boolean().default(true),
  }),
});

export const updateTaxSchema = z.object({
  params: z.object({
    id: z.coerce.number().positive(),
  }),
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    rate: z.coerce.number().min(0).optional(),
    type: z.enum(TAX_TYPES).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const taxIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().positive(),
  }),
});
