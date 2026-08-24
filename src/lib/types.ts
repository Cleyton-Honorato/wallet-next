/**
 * DTOs que cruzam a fronteira servidor → client.
 *
 * Regra: nenhum objeto do Prisma vai direto para uma prop. Tudo passa pelos
 * `toResponse` dos services, que produzem estes tipos planos — `Decimal` vira
 * `number` e `Date` vira string.
 */

export type CategoryType = 'EXPENSE' | 'INCOME';

export interface CategoryDto {
  id: number;
  name: string;
  color: string;
  icon: string | null;
  type: CategoryType;
  isSystem: boolean;
}

/**
 * Lançamentos são a matriz {despesa, receita} × {fixo, variável}.
 *
 * As quatro tabelas têm a mesma forma com nomes diferentes (`dueDay`/
 * `receiptDay`, `isPaid`/`isReceived`). Os services normalizam para `day` e
 * `settled`, o que permite uma única UI para as quatro telas.
 */
export type EntryKind = 'expense' | 'income';

/** Recorrente: existe uma vez e é projetado sobre os meses em que está ativo. */
export interface FixedEntryDto {
  id: number;
  categoryId: number;
  title: string;
  amount: number;
  description: string | null;
  /** `dueDay` na despesa, `receiptDay` na receita. */
  day: number;
  isActive: boolean;
  startDate: string;
  endDate: string | null;
  /** Quitação do mês consultado — vem da tabela de settlements. */
  settled: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Pontual: uma linha por mês, com quitação na própria linha. */
export interface VariableEntryDto {
  id: number;
  categoryId: number;
  title: string;
  estimatedAmount: number;
  actualAmount: number | null;
  description: string | null;
  month: string;
  /** `isPaid` na despesa, `isReceived` na receita. */
  settled: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------ reserva

export type EmergencyFundMovementType = 'DEPOSIT' | 'WITHDRAWAL';

export interface EmergencyFundMovementDto {
  id: number;
  type: EmergencyFundMovementType;
  amount: number;
  date: string;
  description: string | null;
}

export interface EmergencyFundDto {
  id: number;
  balance: number;
  targetAmount: number;
  movements: EmergencyFundMovementDto[];
}

// ----------------------------------------------------------- dashboard

export interface ExpenseByCategoryDto {
  categoryId: number;
  categoryName: string;
  color: string;
  amount: number;
  percentage: number;
}

export interface BudgetLineDto {
  categoryId: number;
  categoryName: string;
  color: string;
  plannedAmount: number;
  spentAmount: number;
  remaining: number;
  usagePercent: number;
}

/**
 * Orçamento de um mês. `id` nulo significa que o mês ainda não tem orçamento —
 * a tela renderiza o estado vazio em vez de tratar isso como erro.
 */
export interface MonthlyBudgetDto {
  id: number | null;
  month: string;
  totalPlanned: number;
  totalSpent: number;
  totalRemaining: number;
  usagePercent: number;
  lines: BudgetLineDto[];
}

export interface DashboardSummaryDto {
  period: { year: number; month: number | null };
  income: { fixed: number; variable: number; total: number };
  expenses: { fixed: number; variable: number; total: number };
  balance: number;
  emergencyFund: {
    balance: number;
    targetAmount: number;
    periodMovements: number;
  };
  investments: { totalValue: number; periodMovements: number };
  expensesByCategory: ExpenseByCategoryDto[];
  monthlyBudget: MonthlyBudgetDto;
}

/** Estado de uma célula da matriz anual. */
export type MatrixCellStatus =
  | 'none'
  | 'pending'
  | 'overdue'
  | 'partial'
  | 'paid';

/** Itens fixos são por item; variáveis são agregados por categoria. */
export type MatrixRowType =
  | 'fixedExpense'
  | 'variableExpenseCategory'
  | 'fixedIncome'
  | 'variableIncomeCategory';

export interface MatrixRowDto {
  id: string;
  label: string;
  /** 12 posições: janeiro (0) a dezembro (11). */
  values: number[];
  statuses: MatrixCellStatus[];
  rowType: MatrixRowType;
  /** Id do item fixo, ou da categoria nas linhas variáveis. */
  refId: number;
}

export interface MatrixSectionDto {
  key: string;
  title: string;
  kind: EntryKind;
  rows: MatrixRowDto[];
}

export interface DashboardMatrixDto {
  year: number;
  sections: MatrixSectionDto[];
  totals: { expenses: number[]; income: number[]; leftover: number[] };
}
