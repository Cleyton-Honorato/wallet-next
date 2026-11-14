import { z } from 'zod';
import {
  amountSchema,
  dateOnlySchema,
  hexColorSchema,
  idSchema,
} from '@/lib/validation';

/** Data-alvo é opcional: campo vazio no form significa "sem prazo". */
const optionalTargetDate = dateOnlySchema
  .nullish()
  .or(z.literal('').transform(() => null));

export const createGoalSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Informe o nome do objetivo')
      .max(80, 'Nome deve ter no máximo 80 caracteres'),
    icon: z.string().max(60).optional(),
    color: hexColorSchema,
    targetAmount: amountSchema,
    targetDate: optionalTargetDate,
  })
  .strict();

export const updateGoalSchema = createGoalSchema
  .partial()
  .extend({ id: idSchema })
  .strict();

export const deleteGoalSchema = z.object({ id: idSchema }).strict();

export const goalMovementSchema = z
  .object({
    id: idSchema,
    type: z.enum(['DEPOSIT', 'WITHDRAWAL']),
    amount: amountSchema,
    date: dateOnlySchema,
    description: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .or(z.literal('').transform(() => undefined)),
  })
  .strict();

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type GoalMovementInput = z.infer<typeof goalMovementSchema>;
