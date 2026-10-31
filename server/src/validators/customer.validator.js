import { z } from 'zod';

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Customer name is required').max(255),
    email: z.string().trim().email('Valid email address is required').toLowerCase(),
    company: z.string().trim().max(255).optional().nullable(),
    phone: z.string().trim().max(50).optional().nullable(),
    addressLine1: z.string().trim().max(255).optional().nullable(),
    addressLine2: z.string().trim().max(255).optional().nullable(),
    city: z.string().trim().max(100).optional().nullable(),
    state: z.string().trim().max(100).optional().nullable(),
    postalCode: z.string().trim().max(20).optional().nullable(),
    country: z.string().trim().max(100).optional().nullable(),
    taxId: z.string().trim().max(100).optional().nullable(),
  }),
});

export const updateCustomerSchema = z.object({
  params: z.object({
    id: z.coerce.number().positive(),
  }),
  body: z.object({
    name: z.string().trim().min(1).max(255).optional(),
    company: z.string().trim().max(255).optional().nullable(),
    phone: z.string().trim().max(50).optional().nullable(),
    addressLine1: z.string().trim().max(255).optional().nullable(),
    addressLine2: z.string().trim().max(255).optional().nullable(),
    city: z.string().trim().max(100).optional().nullable(),
    state: z.string().trim().max(100).optional().nullable(),
    postalCode: z.string().trim().max(20).optional().nullable(),
    country: z.string().trim().max(100).optional().nullable(),
    taxId: z.string().trim().max(100).optional().nullable(),
  }),
});

export const customerIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().positive(),
  }),
});

