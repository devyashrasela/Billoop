import { z } from 'zod';

export const createPaymentTermSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Name is required').max(100),
    dueDays: z.coerce.number().int().min(0, 'Due days must be 0 or greater'),
  }),
});

export const updatePaymentTermSchema = z.object({
  params: z.object({
    id: z.coerce.number().positive(),
  }),
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    dueDays: z.coerce.number().int().min(0).optional(),
  }),
});

export const paymentTermIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().positive(),
  }),
});

