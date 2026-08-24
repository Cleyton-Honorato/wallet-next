'use server';

import {
  deleteBudgetSchema,
  upsertBudgetSchema,
  type UpsertBudgetInput,
} from '@/features/budgets/schemas';
import { authAction } from '@/server/actions/_helpers';
import { deleteBudget, upsertBudget } from '@/server/services/budgets';
import type { ActionResult } from '@/lib/result';
import type { MonthlyBudgetDto } from '@/lib/types';

/** O dashboard mostra o painel do orçamento, então revalida junto. */
const REVALIDATE = ['/budgets', '/'] as const;

export async function upsertBudgetAction(
  input: UpsertBudgetInput,
): Promise<ActionResult<MonthlyBudgetDto>> {
  return authAction({
    schema: upsertBudgetSchema,
    input,
    revalidate: REVALIDATE,
    handler: (data, user) => upsertBudget(user.userId, data),
  });
}

export async function deleteBudgetAction(
  input: { month: string },
): Promise<ActionResult<void>> {
  return authAction({
    schema: deleteBudgetSchema,
    input,
    revalidate: REVALIDATE,
    handler: ({ month }, user) => deleteBudget(user.userId, month),
  });
}
