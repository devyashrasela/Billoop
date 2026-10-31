import { z } from 'zod';
import { isValidPassword } from '../../../shared/validators/password.js';

const passwordSchema = z
  .string()
  .min(9, 'Password must be longer than 8 characters (at least 9)')
  .refine(
    isValidPassword,
    'Password must include at least one uppercase letter, one lowercase letter, and one special character.'
  );

export const registerSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: passwordSchema,
  name: z.string().trim().min(1, 'Name is required'),
  company: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  addressLine1: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  country: z.string().trim().optional(),
  taxId: z.string().trim().optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  client: z.enum(['portal', 'ops']).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  client: z.enum(['portal', 'ops']).optional(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
});

export const staffCreateSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  name: z.string().trim().min(1, 'Name is required'),
  password: passwordSchema.optional(),
});

export const staffUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Name cannot be empty').optional(),
  isActive: z.boolean().optional(),
});
