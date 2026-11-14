/**
 * Cálculos do dashboard — funções puras sobre dados já lidos do banco.
 *
 * Trabalham com números e não com `Decimal`, para que possam ser exercitadas
 * por testes com fixtures simples, sem Prisma e sem banco.
 */

import { getBudgetUsagePercent, getRemaining } from '@/lib/budget';
import {
  coversMonth,
  isMonthPast,
  isPastDue,
  monthKeyOfDate,
  toMonthKey,
} from '@/lib/overdue';
import type {
  ExpenseByCategoryDto,
  MatrixCellStatus,
  MatrixRowDto,
  MatrixRowType,
} from '@/lib/types';
import { countActiveMonthsInPeriod, type PeriodBounds } from './period';

/**
 * A regra de vencimento é de `lib/overdue`, compartilhada com o painel de
 * contas vencidas e com os chips das listas. Reexportada porque a matriz foi
 * a primeira a usá-la e os testes dela continuam sendo o dono do caso.
 */
export { isMonthPast, isPastDue };

/** Item recorrente, com valores já convertidos. */
export interface FixedItem {
  id: number;
  title: string;
  categoryId: number;
  amount: number;
  isActive: boolean;
  startDate: Date;
  endDate: Date | null;
  /** dueDay na despesa, receiptDay na receita. */
  day: number;
}

/** Lançamento pontual, com o valor efetivo já resolvido. */
export interface VariableItem {
  categoryId: number;
  month: string;
  /** actualAmount ?? estimatedAmount. */
  amount: number;
  settled: boolean;
}

export interface CategoryInfo {
  name: string;
  color: string;
}

const FALLBACK_COLOR = '#6b7280';

/** Total de um conjunto de itens fixos projetado sobre o período. */
export function sumFixedOverPeriod(
  items: FixedItem[],
  bounds: PeriodBounds,
  month: number | undefined,
  onEach?: (categoryId: number, amount: number) => void,
): number {
  return items.reduce((sum, item) => {
    const amount =
      item.amount *
      countActiveMonthsInPeriod(item.startDate, item.endDate, bounds, month);
    onEach?.(item.categoryId, amount);
    return sum + amount;
  }, 0);
}

export function sumVariable(
  items: VariableItem[],
  onEach?: (categoryId: number, amount: number) => void,
): number {
  return items.reduce((sum, item) => {
    onEach?.(item.categoryId, item.amount);
    return sum + item.amount;
  }, 0);
}

/** Quebra por categoria, com percentuais arredondados, do maior para o menor. */
export function buildExpensesByCategory(
  totalsByCategory: Map<number, number>,
  categories: Map<number, CategoryInfo>,
): ExpenseByCategoryDto[] {
  const grandTotal = [...totalsByCategory.values()].reduce((s, v) => s + v, 0);

  return [...totalsByCategory.entries()]
    .map(([categoryId, amount]) => {
      const category = categories.get(categoryId);
      return {
        categoryId,
        categoryName: category?.name ?? String(categoryId),
        color: category?.color ?? FALLBACK_COLOR,
        amount,
        percentage:
          grandTotal > 0 ? Math.round((amount / grandTotal) * 100) : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

export function buildBudgetLines(
  lines: { categoryId: number; plannedAmount: number }[],
  spentByCategory: Map<number, number>,
  categories: Map<number, CategoryInfo>,
) {
  return lines.map((line) => {
    const category = categories.get(line.categoryId);
    const spentAmount = spentByCategory.get(line.categoryId) ?? 0;
    return {
      categoryId: line.categoryId,
      categoryName: category?.name ?? String(line.categoryId),
      color: category?.color ?? FALLBACK_COLOR,
      plannedAmount: line.plannedAmount,
      spentAmount,
      remaining: getRemaining(line.plannedAmount, spentAmount),
      usagePercent: getBudgetUsagePercent(spentAmount, line.plannedAmount),
    };
  });
}

// --------------------------------------------------- vigência e gasto

/**
 * Um item recorrente está vigente neste mês? É a janela usada tanto pela
 * matriz anual quanto pelo orçamento, para que ambos concordem sobre o que
 * "existe" em um mês.
 */
export function isActiveInMonth(
  item: Pick<FixedItem, 'isActive' | 'startDate' | 'endDate'>,
  year: number,
  monthIndex: number,
): boolean {
  if (!item.isActive) return false;
  return coversMonth(
    monthKeyOfDate(item.startDate),
    item.endDate ? monthKeyOfDate(item.endDate) : null,
    toMonthKey(year, monthIndex),
  );
}

/**
 * Gasto realizado por categoria em um mês — a definição única do app.
 *
 * Uma despesa fixa vigente conta o valor cheio (é compromisso do mês, paga ou
 * não, como aparece na matriz); uma despesa variável conta o efetivo, caindo
 * no estimado enquanto não for informado.
 */
export function aggregateMonthlySpent(
  fixed: FixedItem[],
  variable: VariableItem[],
  year: number,
  monthIndex: number,
): Map<number, number> {
  const totals = new Map<number, number>();
  const add = (categoryId: number, amount: number) =>
    totals.set(categoryId, (totals.get(categoryId) ?? 0) + amount);

  for (const item of fixed) {
    if (isActiveInMonth(item, year, monthIndex)) add(item.categoryId, item.amount);
  }
  for (const item of variable) {
    add(item.categoryId, item.amount);
  }

  return totals;
}

// ------------------------------------------------------- matriz anual

/** Indexa quitações de itens fixos: id → conjunto de meses (YYYY-MM) quitados. */
export function indexSettlements(
  rows: { id: number; month: string }[],
): Map<number, Set<string>> {
  const map = new Map<number, Set<string>>();
  for (const row of rows) {
    const set = map.get(row.id) ?? new Set<string>();
    set.add(row.month);
    map.set(row.id, set);
  }
  return map;
}

/** Valor e status mensal de um item fixo (despesa ou receita) para o ano. */
export function fixedRow(
  id: string,
  rowType: MatrixRowType,
  item: FixedItem,
  year: number,
  settledMonths: Map<number, Set<string>>,
  now: Date = new Date(),
): MatrixRowDto {
  const settledSet = settledMonths.get(item.id);
  const values: number[] = [];
  const statuses: MatrixCellStatus[] = [];

  for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
    const value = isActiveInMonth(item, year, monthIndex) ? item.amount : 0;
    values.push(value);

    if (!value) {
      statuses.push('none');
      continue;
    }

    const monthKey = toMonthKey(year, monthIndex);
    if (settledSet?.has(monthKey)) {
      statuses.push('paid');
    } else if (
      rowType === 'fixedExpense' &&
      isPastDue(year, monthIndex, item.day, now)
    ) {
      statuses.push('overdue');
    } else {
      statuses.push('pending');
    }
  }

  return { id, label: item.title, values, statuses, rowType, refId: item.id };
}

/**
 * Agrupa lançamentos variáveis por categoria, somando por mês e derivando o
 * status da célula (paid/partial/pending) a partir da flag de quitação.
 */
export function groupVariableByCategory(
  items: VariableItem[],
  categories: Map<number, CategoryInfo>,
  rowType: MatrixRowType,
  year: number,
  now: Date = new Date(),
): MatrixRowDto[] {
  const isExpense = rowType === 'variableExpenseCategory';

  interface Agg {
    values: number[];
    settled: number[];
    total: number[];
  }
  const byCategory = new Map<number, Agg>();

  for (const item of items) {
    const monthIndex = Number(item.month.split('-')[1]) - 1;
    if (monthIndex < 0 || monthIndex > 11) continue;

    const agg =
      byCategory.get(item.categoryId) ??
      ({
        values: new Array<number>(12).fill(0),
        settled: new Array<number>(12).fill(0),
        total: new Array<number>(12).fill(0),
      } satisfies Agg);

    agg.values[monthIndex] += item.amount;
    agg.total[monthIndex] += 1;
    if (item.settled) agg.settled[monthIndex] += 1;
    byCategory.set(item.categoryId, agg);
  }

  return [...byCategory.entries()].map(([categoryId, agg]) => ({
    id: `cat-${categoryId}`,
    label: categories.get(categoryId)?.name ?? String(categoryId),
    values: agg.values,
    statuses: agg.total.map((total, i): MatrixCellStatus => {
      if (total === 0) return 'none';
      if (agg.settled[i] === total) return 'paid';
      if (agg.settled[i] > 0) return 'partial';
      return isExpense && isMonthPast(year, i, now) ? 'overdue' : 'pending';
    }),
    rowType,
    refId: categoryId,
  }));
}

export function sumRows(rows: MatrixRowDto[]): number[] {
  const totals = new Array<number>(12).fill(0);
  for (const row of rows) {
    for (let i = 0; i < 12; i += 1) totals[i] += row.values[i];
  }
  return totals;
}
