import { z } from 'zod';
import { PRODUCT_TYPES } from '../../../shared/constants/index.js';

export const variantSchema = z.object({
  id: z.coerce.number().positive().optional(),
  attribute: z.string().trim().min(1, 'Attribute name is required (e.g. Brand, Edition)').max(100),
  value: z.string().trim().min(1, 'Attribute value is required (e.g. Odoo, Enterprise)').max(100),
  extraPrice: z.coerce.number().min(0, 'Extra price cannot be negative').default(0),
});

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Product name is required').max(255),
    type: z.enum(PRODUCT_TYPES, {
      errorMap: () => ({ message: `Type must be one of: ${PRODUCT_TYPES.join(', ')}` }),
    }).default('service'),
    salesPrice: z.coerce.number().min(0, 'Sales price cannot be negative').default(0),
    costPrice: z.coerce.number().min(0, 'Cost price cannot be negative').default(0),
    notes: z.string().trim().max(1000).optional().nullable(),
    isActive: z.boolean().default(true),
    variants: z.array(variantSchema).optional().default([]),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.coerce.number().positive(),
  }),
  body: z.object({
    name: z.string().trim().min(1).max(255).optional(),
    type: z.enum(PRODUCT_TYPES).optional(),
    salesPrice: z.coerce.number().min(0).optional(),
    costPrice: z.coerce.number().min(0).optional(),
    notes: z.string().trim().max(1000).optional().nullable(),
    isActive: z.boolean().optional(),
    variants: z.array(variantSchema).optional(),
  }),
});

export const createVariantSchema = z.object({
  params: z.object({
    id: z.coerce.number().positive(), // productId
  }),
  body: variantSchema,
});

export const variantParamSchema = z.object({
  id: z.coerce.number().positive(), // productId
  variantId: z.coerce.number().positive(),
});

export const productIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().positive(),
  }),
});
