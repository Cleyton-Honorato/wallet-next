import 'server-only';
import type {
  FixedExpense,
  FixedIncome,
  VariableExpense,
  VariableIncome,
} from '@prisma-app/client';
import { db } from '@/server/db';
import { toNumber } from '@/server/serialization';
import { getSpentByCategory } from '@/server/services/budgets';
import { getBudgetUsagePercent, getRemaining } from '@/lib/budget';
import type {
  DashboardMatrixDto,
  DashboardSummaryDto,
  MatrixSectionDto,
} from '@/lib/types';
import {
  buildBudgetLines,
  buildExpensesByCategory,
  fixedRow,
  groupVariableByCategory,
  indexSettlements,
  sumFixedOverPeriod,
  sumRows,
  sumVariable,
  type CategoryInfo,
  type FixedItem,
  type VariableItem,
} from './compute';
import { getBudgetMonthKey, getPeriodBounds, monthFilter } from './period';

/** Resumo financeiro do período (ano inteiro quando `month` é omitido). */
export async function getDashboardSummary(
  userId: number,
  { year, month }: { year: number; month?: number },
): Promise<DashboardSummaryDto> {
  const bounds = getPeriodBounds(year, month);
  const dateInPeriod = { gte: bounds.start, lte: bounds.end };
  const budgetMonthKey = getBudgetMonthKey(year, month);

  const [
    categories,
    fixedIncomes,
    fixedExpenses,
    variableIncomes,
    variableExpenses,
    emergencyFund,
    investmentPositions,
    investmentMovements,
    budget,
  ] = await Promise.all([
    db.category.findMany({ where: { OR: [{ userId }, { userId: null }] } }),
    db.fixedIncome.findMany({ where: { userId, isActive: true } }),
    db.fixedExpense.findMany({ where: { userId, isActive: true } }),
    db.variableIncome.findMany({
      where: { userId, month: monthFilter(year, month) },
    }),
    db.variableExpense.findMany({
      where: { userId, month: monthFilter(year, month) },
    }),
    db.emergencyFund.findUnique({
      where: { userId },
      include: { movements: { where: { date: dateInPeriod } } },
    }),
    db.investmentPosition.findMany({ where: { userId } }),
    db.investmentMovement.findMany({
      where: { position: { userId }, date: dateInPeriod },
    }),
    db.monthlyBudget.findUnique({
      where: { uq_budget_user_month: { userId, month: budgetMonthKey } },
      include: { lines: true },
    }),
  ]);

  const categoryMap = new Map<number, CategoryInfo>(
    categories.map((c) => [c.id, { name: c.name, color: c.color }]),
  );

  const toFixedItem = (row: FixedExpense | FixedIncome): FixedItem => ({
    id: row.id,
    title: row.title,
    categoryId: row.categoryId,
    amount: toNumber(row.amount),
    isActive: row.isActive,
    startDate: row.startDate,
    endDate: row.endDate,
    day: 1, // irrelevante no resumo; só a matriz usa o dia de vencimento
  });

  const toVariableItem = (
    row: VariableExpense | VariableIncome,
  ): VariableItem => ({
    categoryId: row.categoryId,
    month: row.month,
    amount: toNumber(row.actualAmount) ?? toNumber(row.estimatedAmount),
    settled: false, // o resumo não usa quitação; só a matriz usa
  });

  // Receitas
  const incomeFixed = sumFixedOverPeriod(
    fixedIncomes.map(toFixedItem),
    bounds,
    month,
  );
  const incomeVariable = sumVariable(variableIncomes.map(toVariableItem));

  // Despesas + quebra por categoria
  const totalsByCategory = new Map<number, number>();
  const addToCategory = (categoryId: number, amount: number) =>
    totalsByCategory.set(
      categoryId,
      (totalsByCategory.get(categoryId) ?? 0) + amount,
    );

  const expenseFixed = sumFixedOverPeriod(
    fixedExpenses.map(toFixedItem),
    bounds,
    month,
    addToCategory,
  );
  const expenseVariable = sumVariable(
    variableExpenses.map(toVariableItem),
    addToCategory,
  );

  const expensesByCategory = buildExpensesByCategory(
    totalsByCategory,
    categoryMap,
  );

  const incomeTotal = incomeFixed + incomeVariable;
  const expenseTotal = expenseFixed + expenseVariable;

  // Orçamento do mês — o realizado vem da mesma função que a tela de
  // orçamentos usa, para os dois nunca divergirem. A coluna `spent_amount` do
  // schema segue morta (o trigger previsto nunca existiu).
  const budgetSpentMap = await getSpentByCategory(userId, budgetMonthKey);
  const budgetLines = buildBudgetLines(
    (budget?.lines ?? []).map((line) => ({
      categoryId: line.categoryId,
      plannedAmount: toNumber(line.plannedAmount),
    })),
    budgetSpentMap,
    categoryMap,
  );
  const totalPlanned = budget ? toNumber(budget.totalPlanned) : 0;
  const totalSpent = budgetLines.reduce((s, l) => s + l.spentAmount, 0);

  // Reserva e investimentos
  const emergencyMovements = (emergencyFund?.movements ?? []).reduce(
    (sum, m) =>
      sum + (m.type === 'DEPOSIT' ? toNumber(m.amount) : -toNumber(m.amount)),
    0,
  );
  const investmentsTotal = investmentPositions.reduce(
    (s, p) => s + toNumber(p.currentValue),
    0,
  );
  const investmentMovementsTotal = investmentMovements.reduce(
    (sum, m) =>
      sum + (m.type === 'WITHDRAWAL' ? -toNumber(m.amount) : toNumber(m.amount)),
    0,
  );

  return {
    period: { year, month: month ?? null },
    income: { fixed: incomeFixed, variable: incomeVariable, total: incomeTotal },
    expenses: {
      fixed: expenseFixed,
      variable: expenseVariable,
      total: expenseTotal,
    },
    balance: incomeTotal - expenseTotal,
    emergencyFund: {
      balance: emergencyFund ? toNumber(emergencyFund.balance) : 0,
      targetAmount: emergencyFund ? toNumber(emergencyFund.targetAmount) : 0,
      periodMovements: emergencyMovements,
    },
    investments: {
      totalValue: investmentsTotal,
      periodMovements: investmentMovementsTotal,
    },
    expensesByCategory,
    monthlyBudget: {
      id: budget?.id ?? null,
      month: budgetMonthKey,
      totalPlanned,
      totalSpent,
      totalRemaining: getRemaining(totalPlanned, totalSpent),
      usagePercent: getBudgetUsagePercent(totalSpent, totalPlanned),
      lines: budgetLines,
    },
  };
}

/**
 * Matriz anual (item/categoria × 12 meses) no estilo planilha.
 * Colunas: janeiro (índice 0) … dezembro (índice 11) do `year`.
 */
export async function getAnnualMatrix(
  userId: number,
  year: number,
): Promise<DashboardMatrixDto> {
  const yearPrefix = { startsWith: `${year}-` };

  const [
    categories,
    fixedExpenses,
    variableExpenses,
    fixedIncomes,
    variableIncomes,
    expenseSettlements,
    incomeSettlements,
  ] = await Promise.all([
    db.category.findMany({ where: { OR: [{ userId }, { userId: null }] } }),
    db.fixedExpense.findMany({ where: { userId }, orderBy: { dueDay: 'asc' } }),
    db.variableExpense.findMany({ where: { userId, month: yearPrefix } }),
    db.fixedIncome.findMany({
      where: { userId },
      orderBy: { receiptDay: 'asc' },
    }),
    db.variableIncome.findMany({ where: { userId, month: yearPrefix } }),
    db.fixedExpenseSettlement.findMany({
      where: { paid: true, month: yearPrefix, fixedExpense: { userId } },
      select: { fixedExpenseId: true, month: true },
    }),
    db.fixedIncomeSettlement.findMany({
      where: { received: true, month: yearPrefix, fixedIncome: { userId } },
      select: { fixedIncomeId: true, month: true },
    }),
  ]);

  const categoryMap = new Map<number, CategoryInfo>(
    categories.map((c) => [c.id, { name: c.name, color: c.color }]),
  );

  const expenseSettled = indexSettlements(
    expenseSettlements.map((s) => ({ id: s.fixedExpenseId, month: s.month })),
  );
  const incomeSettled = indexSettlements(
    incomeSettlements.map((s) => ({ id: s.fixedIncomeId, month: s.month })),
  );

  const fixedExpenseRows = fixedExpenses.map((item) =>
    fixedRow(
      `fx-exp-${item.id}`,
      'fixedExpense',
      {
        id: item.id,
        title: item.title,
        categoryId: item.categoryId,
        amount: toNumber(item.amount),
        isActive: item.isActive,
        startDate: item.startDate,
        endDate: item.endDate,
        day: item.dueDay,
      },
      year,
      expenseSettled,
    ),
  );

  const fixedIncomeRows = fixedIncomes.map((item) =>
    fixedRow(
      `fx-inc-${item.id}`,
      'fixedIncome',
      {
        id: item.id,
        title: item.title,
        categoryId: item.categoryId,
        amount: toNumber(item.amount),
        isActive: item.isActive,
        startDate: item.startDate,
        endDate: item.endDate,
        day: item.receiptDay,
      },
      year,
      incomeSettled,
    ),
  );

  const variableExpenseRows = groupVariableByCategory(
    variableExpenses.map((item) => ({
      categoryId: item.categoryId,
      month: item.month,
      amount: toNumber(item.actualAmount) ?? toNumber(item.estimatedAmount),
      settled: item.isPaid,
    })),
    categoryMap,
    'variableExpenseCategory',
    year,
  );

  const variableIncomeRows = groupVariableByCategory(
    variableIncomes.map((item) => ({
      categoryId: item.categoryId,
      month: item.month,
      amount: toNumber(item.actualAmount) ?? toNumber(item.estimatedAmount),
      settled: item.isReceived,
    })),
    categoryMap,
    'variableIncomeCategory',
    year,
  );

  const sections: MatrixSectionDto[] = [
    {
      key: 'fixedExpenses',
      title: 'Despesas fixas',
      kind: 'expense',
      rows: fixedExpenseRows,
    },
    {
      key: 'variableExpenses',
      title: 'Despesas variáveis',
      kind: 'expense',
      rows: variableExpenseRows,
    },
    {
      key: 'fixedIncomes',
      title: 'Receitas fixas',
      kind: 'income',
      rows: fixedIncomeRows,
    },
    {
      key: 'variableIncomes',
      title: 'Receitas variáveis',
      kind: 'income',
      rows: variableIncomeRows,
    },
  ];

  const expenses = sumRows([...fixedExpenseRows, ...variableExpenseRows]);
  const income = sumRows([...fixedIncomeRows, ...variableIncomeRows]);
  const leftover = income.map((value, i) => value - expenses[i]);

  return { year, sections, totals: { expenses, income, leftover } };
}
