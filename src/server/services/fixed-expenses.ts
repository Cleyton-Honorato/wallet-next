import 'server-only';
import type { FixedExpense } from '@prisma-app/client';
import { db } from '@/server/db';
import { NotFoundError } from '@/server/errors';
import { toDateOnly, toIso, toNumber } from '@/server/serialization';
import { assertCategoryUsable } from '@/server/services/categories';
import type { FixedEntryDto } from '@/lib/types';

function toResponse(row: FixedExpense, settled = false): FixedEntryDto {
  return {
    id: row.id,
    categoryId: row.categoryId,
    title: row.title,
    amount: toNumber(row.amount),
    description: row.description,
    day: row.dueDay,
    isActive: row.isActive,
    startDate: toDateOnly(row.startDate),
    endDate: toDateOnly(row.endDate),
    settled,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export async function listFixedExpenses(
  userId: number,
  month?: string,
): Promise<FixedEntryDto[]> {
  const rows = await db.fixedExpense.findMany({
    where: { userId },
    orderBy: { dueDay: 'asc' },
  });

  const paidIds = month
    ? new Set(
        (
          await db.fixedExpenseSettlement.findMany({
            where: {
              month,
              paid: true,
              fixedExpenseId: { in: rows.map((r) => r.id) },
            },
            select: { fixedExpenseId: true },
          })
        ).map((s) => s.fixedExpenseId),
      )
    : null;

  return rows.map((row) => toResponse(row, paidIds?.has(row.id) ?? false));
}

/** Marca/desmarca o pagamento de uma despesa fixa em um mês (YYYY-MM). */
export async function settleFixedExpense(
  userId: number,
  id: number,
  month: string,
  paid: boolean,
): Promise<FixedEntryDto> {
  const row = await assertOwned(userId, id);
  await db.fixedExpenseSettlement.upsert({
    where: { uq_fes_expense_month: { fixedExpenseId: id, month } },
    create: {
      fixedExpenseId: id,
      month,
      paid,
      paidAt: paid ? new Date() : null,
    },
    update: { paid, paidAt: paid ? new Date() : null },
  });
  return toResponse(row, paid);
}

export async function createFixedExpense(
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
  await assertCategoryUsable(userId, input.categoryId, 'EXPENSE');
  const row = await db.fixedExpense.create({
    data: {
      userId,
      categoryId: input.categoryId,
      title: input.title,
      amount: input.amount,
      description: input.description,
      dueDay: input.day,
      isActive: input.isActive ?? true,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : null,
    },
  });
  return toResponse(row);
}

export async function updateFixedExpense(
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
    await assertCategoryUsable(userId, input.categoryId, 'EXPENSE');
  }
  const row = await db.fixedExpense.update({
    where: { id },
    data: {
      categoryId: input.categoryId,
      title: input.title,
      amount: input.amount,
      description: input.description,
      dueDay: input.day,
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

export async function deleteFixedExpense(
  userId: number,
  id: number,
): Promise<void> {
  await assertOwned(userId, id);
  await db.fixedExpense.delete({ where: { id } });
}

/** 404 (não 403) para item de outro usuário: não revela que ele existe. */
async function assertOwned(userId: number, id: number): Promise<FixedExpense> {
  const row = await db.fixedExpense.findUnique({ where: { id } });
  if (!row || row.userId !== userId) {
    throw new NotFoundError('Despesa fixa não encontrada');
  }
  return row;
}
