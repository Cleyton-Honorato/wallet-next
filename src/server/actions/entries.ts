'use server';

import {
  bulkSettleVariableEntrySchema,
  createFixedEntrySchema,
  createVariableEntrySchema,
  deleteEntrySchema,
  settleFixedEntrySchema,
  updateFixedEntrySchema,
  updateVariableEntrySchema,
  type FixedEntryInput,
  type UpdateFixedEntryInput,
  type UpdateVariableEntryInput,
  type VariableEntryInput,
} from '@/features/entries/schemas';
import { authAction } from '@/server/actions/_helpers';
import {
  createFixedExpense,
  deleteFixedExpense,
  settleFixedExpense,
  updateFixedExpense,
} from '@/server/services/fixed-expenses';
import {
  createFixedIncome,
  deleteFixedIncome,
  settleFixedIncome,
  updateFixedIncome,
} from '@/server/services/fixed-incomes';
import {
  bulkSettleVariableExpenses,
  createVariableExpense,
  deleteVariableExpense,
  updateVariableExpense,
} from '@/server/services/variable-expenses';
import {
  bulkSettleVariableIncomes,
  createVariableIncome,
  deleteVariableIncome,
  updateVariableIncome,
} from '@/server/services/variable-incomes';
import type { ActionResult } from '@/lib/result';
import type { EntryKind, FixedEntryDto, VariableEntryDto } from '@/lib/types';

/**
 * As quatro telas de lançamento compartilham estas actions; `kind` apenas
 * escolhe a tabela. O `userId` continua vindo só da sessão.
 *
 * Toda mutação revalida a própria tela e o dashboard, que agrega os quatro.
 */
function fixedPaths(kind: EntryKind) {
  return [kind === 'expense' ? '/expenses/fixed' : '/incomes/fixed', '/'];
}

function variablePaths(kind: EntryKind) {
  return [kind === 'expense' ? '/expenses/variable' : '/incomes/variable', '/'];
}

// ---------------------------------------------------------------- fixos

export async function createFixedEntryAction(
  kind: EntryKind,
  input: FixedEntryInput,
): Promise<ActionResult<FixedEntryDto>> {
  return authAction({
    schema: createFixedEntrySchema,
    input,
    revalidate: fixedPaths(kind),
    handler: (data, user) =>
      kind === 'expense'
        ? createFixedExpense(user.userId, data)
        : createFixedIncome(user.userId, data),
  });
}

export async function updateFixedEntryAction(
  kind: EntryKind,
  input: UpdateFixedEntryInput,
): Promise<ActionResult<FixedEntryDto>> {
  return authAction({
    schema: updateFixedEntrySchema,
    input,
    revalidate: fixedPaths(kind),
    handler: ({ id, ...data }, user) =>
      kind === 'expense'
        ? updateFixedExpense(user.userId, id, data)
        : updateFixedIncome(user.userId, id, data),
  });
}

export async function deleteFixedEntryAction(
  kind: EntryKind,
  input: { id: number },
): Promise<ActionResult<void>> {
  return authAction({
    schema: deleteEntrySchema,
    input,
    revalidate: fixedPaths(kind),
    handler: ({ id }, user) =>
      kind === 'expense'
        ? deleteFixedExpense(user.userId, id)
        : deleteFixedIncome(user.userId, id),
  });
}

export async function settleFixedEntryAction(
  kind: EntryKind,
  input: { id: number; month: string; settled: boolean },
): Promise<ActionResult<FixedEntryDto>> {
  return authAction({
    schema: settleFixedEntrySchema,
    input,
    revalidate: fixedPaths(kind),
    handler: ({ id, month, settled }, user) =>
      kind === 'expense'
        ? settleFixedExpense(user.userId, id, month, settled)
        : settleFixedIncome(user.userId, id, month, settled),
  });
}

// ------------------------------------------------------------- variáveis

export async function createVariableEntryAction(
  kind: EntryKind,
  input: VariableEntryInput,
): Promise<ActionResult<VariableEntryDto>> {
  return authAction({
    schema: createVariableEntrySchema,
    input,
    revalidate: variablePaths(kind),
    handler: (data, user) =>
      kind === 'expense'
        ? createVariableExpense(user.userId, data)
        : createVariableIncome(user.userId, data),
  });
}

export async function updateVariableEntryAction(
  kind: EntryKind,
  input: UpdateVariableEntryInput,
): Promise<ActionResult<VariableEntryDto>> {
  return authAction({
    schema: updateVariableEntrySchema,
    input,
    revalidate: variablePaths(kind),
    handler: ({ id, ...data }, user) =>
      kind === 'expense'
        ? updateVariableExpense(user.userId, id, data)
        : updateVariableIncome(user.userId, id, data),
  });
}

export async function deleteVariableEntryAction(
  kind: EntryKind,
  input: { id: number },
): Promise<ActionResult<void>> {
  return authAction({
    schema: deleteEntrySchema,
    input,
    revalidate: variablePaths(kind),
    handler: ({ id }, user) =>
      kind === 'expense'
        ? deleteVariableExpense(user.userId, id)
        : deleteVariableIncome(user.userId, id),
  });
}

export async function bulkSettleVariableEntriesAction(
  kind: EntryKind,
  input: { categoryId: number; month: string; settled: boolean },
): Promise<ActionResult<{ updated: number }>> {
  return authAction({
    schema: bulkSettleVariableEntrySchema,
    input,
    revalidate: variablePaths(kind),
    handler: ({ categoryId, month, settled }, user) =>
      kind === 'expense'
        ? bulkSettleVariableExpenses(user.userId, categoryId, month, settled)
        : bulkSettleVariableIncomes(user.userId, categoryId, month, settled),
  });
}
