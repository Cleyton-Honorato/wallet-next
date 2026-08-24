import 'server-only';
import type { FixedIncome } from '@prisma-app/client';
import { db } from '@/server/db';
import { NotFoundError } from '@/server/errors';
import { toDateOnly, toIso, toNumber } from '@/server/serialization';
import { assertCategoryUsable } from '@/server/services/categories';
import type { FixedEntryDto } from '@/lib/types';

function toResponse(row: FixedIncome, settled = false): FixedEntryDto {
  return {
    id: row.id,
    categoryId: row.categoryId,
    title: row.title,
    amount: toNumber(row.amount),
    description: row.description,
    day: row.receiptDay,
    isActive: row.isActive,
    startDate: toDateOnly(row.startDate),
    endDate: toDateOnly(row.endDate),
    settled,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export async function listFixedIncomes(
  userId: number,
  month?: string,
): Promise<FixedEntryDto[]> {
  const rows = await db.fixedIncome.findMany({
    where: { userId },
    orderBy: { receiptDay: 'asc' },
  });

  const receivedIds = month
    ? new Set(
        (
          await db.fixedIncomeSettlement.findMany({
            where: {
              month,
              received: true,
              fixedIncomeId: { in: rows.map((r) => r.id) },
            },
            select: { fixedIncomeId: true },
          })
        ).map((s) => s.fixedIncomeId),
      )
    : null;

  return rows.map((row) => toResponse(row, receivedIds?.has(row.id) ?? false));
}

/** Marca/desmarca o recebimento de uma receita fixa em um mês (YYYY-MM). */
export async function settleFixedIncome(
  userId: number,
  id: number,
  month: string,
  received: boolean,
): Promise<FixedEntryDto> {
  const row = await assertOwned(userId, id);
  await db.fixedIncomeSettlement.upsert({
    where: { uq_fis_income_month: { fixedIncomeId: id, month } },
    create: {
      fixedIncomeId: id,
      month,
      received,
      receivedAt: received ? new Date() : null,
    },
    update: { received, receivedAt: received ? new Date() : null },
  });
  return toResponse(row, received);
}

export async function createFixedIncome(
  userId: number,
  input: {
    categoryId: number;
    title: string;
    amount: number;
    description?: string | null;
    day: number;
    isActive?: boolean;
    startDate: string;
    endDate?: string | null;
  },
): Promise<FixedEntryDto> {
  await assertCategoryUsable(userId, input.categoryId, 'INCOME');
  const row = await db.fixedIncome.create({
    data: {
      userId,
      categoryId: input.categoryId,
      title: input.title,
      amount: input.amount,
      description: input.description,
      receiptDay: input.day,
      isActive: input.isActive ?? true,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : null,
    },
  });
  return toResponse(row);
}

export async function updateFixedIncome(
  userId: number,
  id: number,
  input: {
    categoryId?: number;
    title?: string;
    amount?: number;
    description?: string | null;
    day?: number;
    isActive?: boolean;
    startDate?: string;
    endDate?: string | null;
  },
): Promise<FixedEntryDto> {
  await assertOwned(userId, id);
  if (input.categoryId !== undefined) {
    await assertCategoryUsable(userId, input.categoryId, 'INCOME');
  }
  const row = await db.fixedIncome.update({
    where: { id },
    data: {
      categoryId: input.categoryId,
      title: input.title,
      amount: input.amount,
      description: input.description,
      receiptDay: input.day,
      isActive: input.isActive,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate:
        input.endDate === undefined
          ? undefined
          : input.endDate
            ? new Date(input.endDate)
            : null,
    },
  });
  return toResponse(row);
}

export async function deleteFixedIncome(
  userId: number,
  id: number,
): Promise<void> {
  await assertOwned(userId, id);
  await db.fixedIncome.delete({ where: { id } });
}

/** 404 (não 403) para item de outro usuário: não revela que ele existe. */
async function assertOwned(userId: number, id: number): Promise<FixedIncome> {
  const row = await db.fixedIncome.findUnique({ where: { id } });
  if (!row || row.userId !== userId) {
    throw new NotFoundError('Receita fixa não encontrada');
  }
  return row;
}
