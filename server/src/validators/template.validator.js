import { z } from 'zod';

export const templateLineSchema = z.object({
  id: z.coerce.number().positive().optional(),
  productId: z.coerce.number().positive('Product is required'),
  variantId: z.coerce.number().positive().optional().nullable(),
  qty: z.coerce.number().int().min(1, 'Quantity must be at least 1').default(1),
  unitPrice: z.coerce.number().min(0, 'Unit price cannot be negative').optional().nullable(),
  taxId: z.coerce.number().positive().optional().nullable(),
});

export const createTemplateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Template name is required').max(255),
    planId: z.coerce.number().positive('Plan is required'),
    validityDays: z.coerce.number().int().min(1, 'Validity days must be at least 1').default(30),
    paymentTermId: z.coerce.number().positive().optional().nullable(),
    isActive: z.boolean().default(true),
    lines: z.array(templateLineSchema).min(1, 'At least one line item is required'),
  }),
});

export const updateTemplateSchema = z.object({
  params: z.object({
    id: z.coerce.number().positive(),
  }),
  body: z.object({
    name: z.string().trim().min(1).max(255).optional(),
    planId: z.coerce.number().positive().optional(),
    validityDays: z.coerce.number().int().min(1).optional(),
    paymentTermId: z.coerce.number().positive().optional().nullable(),
    isActive: z.boolean().optional(),
    lines: z.array(templateLineSchema).optional(),
  }),
});

export const templateIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().positive(),
  }),
});
