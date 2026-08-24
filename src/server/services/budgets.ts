import 'server-only';
import { db } from '@/server/db';
import { BadRequestError, NotFoundError } from '@/server/errors';
import { toNumber } from '@/server/serialization';
import {
  aggregateMonthlySpent,
  buildBudgetLines,
  type CategoryInfo,
} from '@/server/services/dashboard/compute';
import { getBudgetUsagePercent, getRemaining } from '@/lib/budget';
import type { MonthlyBudgetDto } from '@/lib/types';

interface BudgetLineInput {
  categoryId: number;
  plannedAmount: number;
}

/** Quebra 'YYYY-MM' no par que os cálculos de vigência esperam. */
function parseMonthKey(month: string): { year: number; monthIndex: number } {
  const [year, monthPart] = month.split('-');
  return { year: Number(year), monthIndex: Number(monthPart) - 1 };
}

/**
 * Gasto realizado por categoria no mês — fonte única, consumida pela tela de
 * orçamentos e pelo painel do dashboard.
 *
 * Despesas fixas entram pelo período de vigência (não têm `month` próprio);
 * variáveis, pelo mês do lançamento.
 */
export async function getSpentByCategory(
  userId: number,
  month: string,
): Promise<Map<number, number>> {
  const { year, monthIndex } = parseMonthKey(month);

  const [fixed, variable] = await Promise.all([
    db.fixedExpense.findMany({ where: { userId, isActive: true } }),
    db.variableExpense.findMany({ where: { userId, month } }),
  ]);

  return aggregateMonthlySpent(
    fixed.map((row) => ({
      id: row.id,
      title: row.title,
      categoryId: row.categoryId,
      amount: toNumber(row.amount),
      isActive: row.isActive,
      startDate: row.startDate,
      endDate: row.endDate,
      day: row.dueDay,
    })),
    variable.map((row) => ({
      categoryId: row.categoryId,
      month: row.month,
      amount: toNumber(row.actualAmount) ?? toNumber(row.estimatedAmount),
      settled: row.isPaid,
    })),
    year,
    monthIndex,
  );
}

/** Orçamento do mês. Quando não existe, devolve um DTO vazio com `id: null`. */
export async function getBudgetForMonth(
  userId: number,
  month: string,
): Promise<MonthlyBudgetDto> {
  const [budget, spentByCategory, categories] = await Promise.all([
    db.monthlyBudget.findUnique({
      where: { uq_budget_user_month: { userId, month } },
      include: { lines: true },
    }),
    getSpentByCategory(userId, month),
    db.category.findMany({ where: { OR: [{ userId }, { userId: null }] } }),
  ]);

  const categoryMap = new Map<number, CategoryInfo>(
    categories.map((c) => [c.id, { name: c.name, color: c.color }]),
  );

  const lines = buildBudgetLines(
    (budget?.lines ?? []).map((line) => ({
      categoryId: line.categoryId,
      plannedAmount: toNumber(line.plannedAmount),
    })),
    spentByCategory,
    categoryMap,
  ).sort((a, b) => b.plannedAmount - a.plannedAmount);

  const totalPlanned = budget ? toNumber(budget.totalPlanned) : 0;
  const totalSpent = lines.reduce((sum, line) => sum + line.spentAmount, 0);

  return {
    id: budget?.id ?? null,
    month,
    totalPlanned,
    totalSpent,
    totalRemaining: getRemaining(totalPlanned, totalSpent),
    usagePercent: getBudgetUsagePercent(totalSpent, totalPlanned),
    lines,
  };
}

/**
 * Cria ou substitui o orçamento do mês. As linhas são trocadas por inteiro:
 * o que chega é o orçamento final, não um delta.
 */
export async function upsertBudget(
  userId: number,
  input: { month: string; lines: BudgetLineInput[] },
): Promise<MonthlyBudgetDto> {
  const categoryIds = input.lines.map((line) => line.categoryId);
  if (new Set(categoryIds).size !== categoryIds.length) {
    throw new BadRequestError('Cada categoria pode aparecer uma única vez');
  }

  await assertCategoriesUsable(userId, categoryIds);

  const totalPlanned = input.lines.reduce(
    (sum, line) => sum + line.plannedAmount,
    0,
  );

  await db.$transaction(async (tx) => {
    const saved = await tx.monthlyBudget.upsert({
      where: { uq_budget_user_month: { userId, month: input.month } },
      create: { userId, month: input.month, totalPlanned },
      update: { totalPlanned },
    });
    await tx.budgetLine.deleteMany({ where: { budgetId: saved.id } });
    await tx.budgetLine.createMany({
      data: input.lines.map((line) => ({
        budgetId: saved.id,
        categoryId: line.categoryId,
        plannedAmount: line.plannedAmount,
      })),
    });
  });

  return getBudgetForMonth(userId, input.month);
}

export async function deleteBudget(
  userId: number,
  month: string,
): Promise<void> {
  const budget = await db.monthlyBudget.findUnique({
    where: { uq_budget_user_month: { userId, month } },
  });
  if (!budget) {
    throw new NotFoundError('Orçamento não encontrado para o mês');
  }
  await db.monthlyBudget.delete({ where: { id: budget.id } });
}

/**
 * Mesma semântica de `assertCategoryUsable`, mas resolvendo todas as
 * categorias numa consulta só — um orçamento traz várias linhas de uma vez.
 */
async function assertCategoriesUsable(
  userId: number,
  categoryIds: number[],
): Promise<void> {
  if (categoryIds.length === 0) return;

  const categories = await db.category.findMany({
    where: { id: { in: categoryIds } },
  });
  const byId = new Map(categories.map((c) => [c.id, c]));

  for (const categoryId of categoryIds) {
    const category = byId.get(categoryId);
    // Categoria de outro usuário responde como inexistente.
    if (!category || (category.userId !== userId && category.userId !== null)) {
      throw new NotFoundError('Categoria não encontrada');
    }
    if (category.type !== 'EXPENSE') {
      throw new BadRequestError('O orçamento só aceita categorias de despesa');
    }
  }
}
