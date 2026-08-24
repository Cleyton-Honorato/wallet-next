import 'server-only';
import type { Prisma } from '@prisma-app/client';
import { db } from '@/server/db';
import { NotFoundError } from '@/server/errors';
import { toIso, toNumber } from '@/server/serialization';
import { assertCategoryUsable } from '@/server/services/categories';
import type { VariableEntryDto } from '@/lib/types';

type WithTags = Prisma.VariableExpenseModel & { tags: { tag: string }[] };

function toResponse(row: WithTags): VariableEntryDto {
  return {
    id: row.id,
    categoryId: row.categoryId,
    title: row.title,
    estimatedAmount: toNumber(row.estimatedAmount),
    actualAmount: toNumber(row.actualAmount),
    description: row.description,
    month: row.month,
    settled: row.isPaid,
    tags: row.tags.map((t) => t.tag),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export async function listVariableExpenses(
  userId: number,
  month?: string,
): Promise<VariableEntryDto[]> {
  const rows = await db.variableExpense.findMany({
    where: { userId, ...(month ? { month } : {}) },
    include: { tags: true },
    orderBy: [{ month: 'desc' }, { id: 'desc' }],
  });
  return rows.map(toResponse);
}

export async function createVariableExpense(
  userId: number,
  input: {
    categoryId: number;
    title: string;
    estimatedAmount: number;
    actualAmount?: number | null;
    description?: string | null;
    month: string;
    settled?: boolean;
    tags?: string[];
  },
): Promise<VariableEntryDto> {
  await assertCategoryUsable(userId, input.categoryId, 'EXPENSE');
  const row = await db.variableExpense.create({
    data: {
      userId,
      categoryId: input.categoryId,
      title: input.title,
      estimatedAmount: input.estimatedAmount,
      actualAmount: input.actualAmount ?? null,
      description: input.description,
      month: input.month,
      isPaid: input.settled ?? false,
      tags: input.tags?.length
        ? { create: input.tags.map((tag) => ({ tag })) }
        : undefined,
    },
    include: { tags: true },
  });
  return toResponse(row);
}

export async function updateVariableExpense(
  userId: number,
  id: number,
  input: {
    categoryId?: number;
    title?: string;
    estimatedAmount?: number;
    actualAmount?: number | null;
    description?: string | null;
    month?: string;
    settled?: boolean;
    tags?: string[];
  },
): Promise<VariableEntryDto> {
  await assertOwned(userId, id);
  if (input.categoryId !== undefined) {
    await assertCategoryUsable(userId, input.categoryId, 'EXPENSE');
  }
  const row = await db.variableExpense.update({
    where: { id },
    data: {
      categoryId: input.categoryId,
      title: input.title,
      estimatedAmount: input.estimatedAmount,
      actualAmount: input.actualAmount,
      description: input.description,
      month: input.month,
      isPaid: input.settled,
      tags: input.tags
        ? { deleteMany: {}, create: input.tags.map((tag) => ({ tag })) }
        : undefined,
    },
    include: { tags: true },
  });
  return toResponse(row);
}

export async function deleteVariableExpense(
  userId: number,
  id: number,
): Promise<void> {
  await assertOwned(userId, id);
  await db.variableExpense.delete({ where: { id } });
}

/**
 * Marca todas as despesas variáveis de uma categoria/mês como pagas/pendentes.
 * Ao pagar, preenche `actualAmount` com `estimatedAmount` quando ainda nulo.
 */
export async function bulkSettleVariableExpenses(
  userId: number,
  categoryId: number,
  month: string,
  paid: boolean,
): Promise<{ updated: number }> {
  const rows = await db.variableExpense.findMany({
    where: { userId, categoryId, month },
    select: { id: true, estimatedAmount: true, actualAmount: true },
  });
  await db.$transaction(
    rows.map((row) =>
      db.variableExpense.update({
        where: { id: row.id },
        data: {
          isPaid: paid,
          actualAmount: paid
            ? (row.actualAmount ?? row.estimatedAmount)
            : row.actualAmount,
        },
      }),
    ),
  );
  return { updated: rows.length };
}

/** 404 (não 403) para item de outro usuário: não revela que ele existe. */
async function assertOwned(userId: number, id: number): Promise<void> {
  const row = await db.variableExpense.findUnique({ where: { id } });
  if (!row || row.userId !== userId) {
    throw new NotFoundError('Despesa variável não encontrada');
  }
}
