import { z } from 'zod';

export const portalIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().positive('ID must be a positive integer'),
  }),
});

export const updatePortalProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Name is required').max(100).optional(),
    company: z.string().trim().max(100).optional().nullable(),
    phone: z.string().trim().max(50).optional().nullable(),
    taxId: z.string().trim().max(50).optional().nullable(),
    addressLine1: z.string().trim().max(255).optional().nullable(),
    addressLine2: z.string().trim().max(255).optional().nullable(),
    city: z.string().trim().max(100).optional().nullable(),
    state: z.string().trim().max(100).optional().nullable(),
    postalCode: z.string().trim().max(20).optional().nullable(),
    country: z.string().trim().max(100).optional().nullable(),
  }),
});

export const portalCloseSubSchema = z.object({
  params: z.object({
    id: z.coerce.number().positive(),
  }),
  body: z.object({
    reason: z.string().trim().max(255).optional().default('Cancelled by customer via self-service portal'),
  }),
});

