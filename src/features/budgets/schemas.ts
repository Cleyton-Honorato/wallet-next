import { z } from 'zod';
import { idSchema, monthKeySchema, optionalAmountSchema } from '@/lib/validation';

export const budgetLineInputSchema = z
  .object({
    categoryId: idSchema,
    // Zero é válido: serve para "não pretendo gastar nada aqui este mês".
    plannedAmount: optionalAmountSchema,
  })
  .strict();

export const upsertBudgetSchema = z
  .object({
    month: monthKeySchema,
    lines: z
      .array(budgetLineInputSchema)
      .min(1, 'Adicione ao menos uma categoria'),
  })
  .strict();

export const deleteBudgetSchema = z.object({ month: monthKeySchema }).strict();

export type BudgetLineInput = z.infer<typeof budgetLineInputSchema>;
export type UpsertBudgetInput = z.infer<typeof upsertBudgetSchema>;
