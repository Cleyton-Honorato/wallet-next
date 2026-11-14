import 'server-only';
import type { Prisma } from '@prisma-app/client';
import { db } from '@/server/db';
import { toNumber } from '@/server/serialization';
import { isActiveInMonth } from '@/server/services/dashboard/compute';
import {
  clampDueDay,
  daysLate,
  daysLateMonthEnd,
  daysUntilDue,
  isMonthPast,
  isPastDue,
  parseMonthKey,
  toMonthKey,
} from '@/lib/overdue';
import type {
  NextBillDto,
  OverdueBillDto,
  OverdueSummaryDto,
} from '@/lib/types';

const FALLBACK_COLOR = '#6b7280';

/**
 * Contas vencidas e em aberto do ano corrente, de janeiro até hoje.
 *
 * O recorte é o ano — e não o mês — porque uma conta esquecida em julho
 * continua sendo dívida em agosto: o painel só cumpre seu papel se ela
 * aparecer junto, com os dias de atraso. Note que isso é deliberadamente
 * independente do filtro de período do dashboard: é um alerta sobre hoje,
 * não um relatório do recorte escolhido.
 *
 * Só despesa vence. Receita atrasada é frustração, não dívida.
 */
export async function getOverdueBills(
  userId: number,
  now: Date = new Date(),
): Promise<OverdueSummaryDto> {
  const year = now.getFullYear();
  const currentMonthIndex = now.getMonth();
  const yearPrefix = { startsWith: `${year}-` };

  const [categories, fixedExpenses, settlements, variableExpenses] =
    await Promise.all([
      db.category.findMany({ where: { OR: [{ userId }, { userId: null }] } }),
      db.fixedExpense.findMany({ where: { userId, isActive: true } }),
      db.fixedExpenseSettlement.findMany({
        where: { paid: true, month: yearPrefix, fixedExpense: { userId } },
        select: { fixedExpenseId: true, month: true },
      }),
      db.variableExpense.findMany({
        where: { userId, isPaid: false, month: yearPrefix },
      }),
    ]);

  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const categoryColor = new Map(categories.map((c) => [c.id, c.color]));

  const paid = new Set(
    settlements.map((s) => `${s.fixedExpenseId}-${s.month}`),
  );

  const items: OverdueBillDto[] = [];

  // Fixas: cada mês vigente do ano é uma cobrança, verificada uma a uma.
  for (const expense of fixedExpenses) {
    for (
      let monthIndex = 0;
      monthIndex <= currentMonthIndex;
      monthIndex += 1
    ) {
      if (!isActiveInMonth(expense, year, monthIndex)) continue;
      if (!isPastDue(year, monthIndex, expense.dueDay, now)) continue;

      const month = toMonthKey(year, monthIndex);
      if (paid.has(`${expense.id}-${month}`)) continue;

      items.push({
        key: `fixed-${expense.id}-${month}`,
        kind: 'fixed',
        id: expense.id,
        title: expense.title,
        categoryName: categoryName.get(expense.categoryId) ?? '—',
        color: categoryColor.get(expense.categoryId) ?? FALLBACK_COLOR,
        amount: toNumber(expense.amount),
        month,
        daysLate: daysLate(year, monthIndex, expense.dueDay, now),
      });
    }
  }

  // Variáveis: a própria linha é a cobrança, e vence junto com o mês.
  for (const expense of variableExpenses) {
    const period = parseMonthKey(expense.month);
    if (!period) continue;
    if (!isMonthPast(period.year, period.monthIndex, now)) continue;

    items.push({
      key: `variable-${expense.id}`,
      kind: 'variable',
      id: expense.id,
      title: expense.title,
      categoryName: categoryName.get(expense.categoryId) ?? '—',
      color: categoryColor.get(expense.categoryId) ?? FALLBACK_COLOR,
      amount:
        toNumber(expense.actualAmount) ?? toNumber(expense.estimatedAmount),
      month: expense.month,
      daysLate: daysLateMonthEnd(period.year, period.monthIndex, now),
    });
  }

  // Mais atrasado primeiro; a chave desempata para a ordem não oscilar.
  items.sort(
    (a, b) => b.daysLate - a.daysLate || a.key.localeCompare(b.key),
  );

  return {
    total: items.reduce((sum, item) => sum + item.amount, 0),
    count: items.length,
    items,
    next: findNextBill(fixedExpenses, paid, categoryName, categoryColor, now),
  };
}

/**
 * A cobrança fixa mais próxima que ainda não venceu, olhando o mês corrente e
 * o seguinte — o suficiente para sempre haver uma "próxima" quando o mês atual
 * já passou de todos os vencimentos.
 */
function findNextBill(
  expenses: {
    id: number;
    title: string;
    categoryId: number;
    amount: Prisma.Decimal;
    dueDay: number;
    isActive: boolean;
    startDate: Date;
    endDate: Date | null;
  }[],
  paid: Set<string>,
  categoryName: Map<number, string>,
  categoryColor: Map<number, string>,
  now: Date,
): NextBillDto | null {
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  let best: NextBillDto | null = null;

  for (const offset of [0, 1]) {
    const date = new Date(year, monthIndex + offset, 1);
    const targetYear = date.getFullYear();
    const targetMonth = date.getMonth();

    for (const expense of expenses) {
      if (!isActiveInMonth(expense, targetYear, targetMonth)) continue;
      if (isPastDue(targetYear, targetMonth, expense.dueDay, now)) continue;

      const month = toMonthKey(targetYear, targetMonth);
      if (paid.has(`${expense.id}-${month}`)) continue;

      const day = clampDueDay(targetYear, targetMonth, expense.dueDay);
      const candidate: NextBillDto = {
        id: expense.id,
        title: expense.title,
        categoryName: categoryName.get(expense.categoryId) ?? '—',
        color: categoryColor.get(expense.categoryId) ?? FALLBACK_COLOR,
        amount: toNumber(expense.amount),
        month,
        dueDate: `${month}-${String(day).padStart(2, '0')}`,
        daysUntil: daysUntilDue(targetYear, targetMonth, expense.dueDay, now),
      };

      if (!best || candidate.dueDate < best.dueDate) best = candidate;
    }

    if (best) break; // achou no mês corrente: não precisa olhar o seguinte
  }

  return best;
}

/**
 * Quita de uma vez tudo o que está vencido. É a ação em massa do painel, e
 * usa exatamente a mesma lista que ele mostra — nada é quitado fora do que o
 * usuário viu. A variável assume o valor exibido quando não tem efetivo.
 */
export async function settleAllOverdue(
  userId: number,
  now: Date = new Date(),
): Promise<{ settled: number }> {
  const { items } = await getOverdueBills(userId, now);
  if (items.length === 0) return { settled: 0 };

  const paidAt = new Date();
  await db.$transaction([
    ...items
      .filter((item) => item.kind === 'fixed')
      .map((item) =>
        db.fixedExpenseSettlement.upsert({
          where: {
            uq_fes_expense_month: {
              fixedExpenseId: item.id,
              month: item.month,
            },
          },
          create: {
            fixedExpenseId: item.id,
            month: item.month,
            paid: true,
            paidAt,
          },
          update: { paid: true, paidAt },
        }),
      ),
    ...items
      .filter((item) => item.kind === 'variable')
      .map((item) =>
        db.variableExpense.update({
          where: { id: item.id },
          data: { isPaid: true, actualAmount: item.amount },
        }),
      ),
  ]);

  return { settled: items.length };
}
