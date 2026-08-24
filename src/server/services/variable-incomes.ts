import 'server-only';
import type { Prisma } from '@prisma-app/client';
import { db } from '@/server/db';
import { NotFoundError } from '@/server/errors';
import { toIso, toNumber } from '@/server/serialization';
import { assertCategoryUsable } from '@/server/services/categories';
import type { VariableEntryDto } from '@/lib/types';

type WithTags = Prisma.VariableIncomeModel & { tags: { tag: string }[] };

function toResponse(row: WithTags): VariableEntryDto {
  return {
    id: row.id,
    categoryId: row.categoryId,
    title: row.title,
    estimatedAmount: toNumber(row.estimatedAmount),
    actualAmount: toNumber(row.actualAmount),
    description: row.description,
    month: row.month,
    settled: row.isReceived,
    tags: row.tags.map((t) => t.tag),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export async function listVariableIncomes(
  userId: number,
  month?: string,
): Promise<VariableEntryDto[]> {
  const rows = await db.variableIncome.findMany({
    where: { userId, ...(month ? { month } : {}) },
    include: { tags: true },
    orderBy: [{ month: 'desc' }, { id: 'desc' }],
  });
  return rows.map(toResponse);
}

export async function createVariableIncome(
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
  await assertCategoryUsable(userId, input.categoryId, 'INCOME');
  const row = await db.variableIncome.create({
    data: {
      userId,
      categoryId: input.categoryId,
      title: input.title,
      estimatedAmount: input.estimatedAmount,
      actualAmount: input.actualAmount ?? null,
      description: input.description,
      month: input.month,
      isReceived: input.settled ?? false,
      tags: input.tags?.length
        ? { create: input.tags.map((tag) => ({ tag })) }
        : undefined,
    },
    include: { tags: true },
  });
  return toResponse(row);
}

export async function updateVariableIncome(
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
    await assertCategoryUsable(userId, input.categoryId, 'INCOME');
  }
  const row = await db.variableIncome.update({
    where: { id },
    data: {
      categoryId: input.categoryId,
      title: input.title,
      estimatedAmount: input.estimatedAmount,
      actualAmount: input.actualAmount,
      description: input.description,
      month: input.month,
      isReceived: input.settled,
      tags: input.tags
        ? { deleteMany: {}, create: input.tags.map((tag) => ({ tag })) }
        : undefined,
    },
    include: { tags: true },
  });
  return toResponse(row);
}

export async function deleteVariableIncome(
  userId: number,
  id: number,
): Promise<void> {
  await assertOwned(userId, id);
  await db.variableIncome.delete({ where: { id } });
}

/**
 * Marca todas as receitas variáveis de uma categoria/mês como recebidas.
 * Ao receber, preenche `actualAmount` com `estimatedAmount` quando ainda nulo.
 */
export async function bulkSettleVariableIncomes(
  userId: number,
  categoryId: number,
  month: string,
  received: boolean,
): Promise<{ updated: number }> {
  const rows = await db.variableIncome.findMany({
    where: { userId, categoryId, month },
    select: { id: true, estimatedAmount: true, actualAmount: true },
  });
  await db.$transaction(
    rows.map((row) =>
      db.variableIncome.update({
        where: { id: row.id },
        data: {
          isReceived: received,
          actualAmount: received
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
  const row = await db.variableIncome.findUnique({ where: { id } });
  if (!row || row.userId !== userId) {
    throw new NotFoundError('Receita variável não encontrada');
  }
}
