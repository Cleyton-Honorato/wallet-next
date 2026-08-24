import { z } from 'zod';
import { emailSchema, passwordSchema } from '@/lib/validation';

export const loginSchema = z
  .object({
    email: emailSchema,
    // No login basta estar preenchida: o tamanho mínimo é regra de cadastro.
    password: z.string().min(1, 'Informe a senha'),
  })
  .strict();

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();

export const forgotPasswordSchema = z
  .object({ email: emailSchema })
  .strict();

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, 'Informe o código'),
    password: passwordSchema,
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
