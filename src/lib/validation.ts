import { z } from 'zod';
import { MONTH_KEY_PATTERN } from '@/lib/month';

/**
 * Blocos de validação compartilhados entre o form (zodResolver) e a action.
 * Espelham os decorators do class-validator da API anterior.
 */

export const monthKeySchema = z
  .string()
  .regex(MONTH_KEY_PATTERN, 'Mês deve estar no formato YYYY-MM');

export const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve estar no formato #RRGGBB');

export const dayOfMonthSchema = z.coerce
  .number()
  .int('Dia deve ser um número inteiro')
  .min(1, 'Dia deve ser no mínimo 1')
  .max(31, 'Dia deve ser no máximo 31');

/** Valor monetário positivo — Decimal(12,2) no banco. */
export const amountSchema = z.coerce
  .number()
  .positive('Valor deve ser maior que zero')
  .max(9_999_999_999.99, 'Valor acima do limite suportado');

export const optionalAmountSchema = z.coerce
  .number()
  .nonnegative('Valor não pode ser negativo')
  .max(9_999_999_999.99, 'Valor acima do limite suportado');

export const idSchema = z.coerce
  .number()
  .int()
  .positive('Identificador inválido');

export const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato AAAA-MM-DD');

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'E-mail é obrigatório')
  .email('E-mail inválido');

export const passwordSchema = z
  .string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres');

/** Converte a saída de `z.treeifyError` em `Record<campo, mensagens[]>`. */
export function toFieldErrors(
  error: z.ZodError,
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_root';
    (result[key] ??= []).push(issue.message);
  }
  return result;
}
