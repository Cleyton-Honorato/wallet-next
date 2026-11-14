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

// ---------------------------------------------------------- objetivos

export type GoalMovementType = 'DEPOSIT' | 'WITHDRAWAL';

export interface GoalMovementDto {
  id: number;
  type: GoalMovementType;
  amount: number;
  date: string;
  description: string | null;
}

/** Meta de poupança. `remaining`/`usagePercent`/`completed` são derivados. */
export interface GoalDto {
  id: number;
  name: string;
  icon: string | null;
  color: string;
  targetAmount: number;
  balance: number;
  remaining: number;
  usagePercent: number;
  completed: boolean;
  /** 'YYYY-MM-DD' ou null quando o objetivo não tem prazo. */
  targetDate: string | null;
  movements: GoalMovementDto[];
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
  /**
   * Objetivos. `periodNet` é o quanto foi separado no período (aportes menos
   * resgates) — já descontado de `balance`, porque guardar dinheiro num
   * objetivo tira do saldo disponível do mês.
   */
  goals: {
    totalSaved: number;
    periodNet: number;
    items: {
      id: number;
      name: string;
      color: string;
      balance: number;
      targetAmount: number;
      usagePercent: number;
    }[];
  };
}

// ----------------------------------------------------- contas vencidas

/**
 * Uma cobrança vencida e em aberto. Uma despesa fixa não paga há vários meses
 * vira um item por mês — é assim que o domínio a modela, cada mês é uma
 * cobrança própria, com sua própria quitação.
 */
export interface OverdueBillDto {
  /** Identidade da cobrança (item + mês), única na lista. */
  key: string;
  kind: 'fixed' | 'variable';
  /** Id do lançamento de origem, para quitar direto do painel. */
  id: number;
  title: string;
  categoryName: string;
  color: string;
  amount: number;
  /** Mês da cobrança, 'YYYY-MM'. */
  month: string;
  daysLate: number;
}

/**
 * A próxima conta a vencer — o contraponto do painel: além do que ficou para
 * trás, o que exige atenção a seguir. Só despesa fixa entra, porque só ela tem
 * dia de vencimento; a variável vence com o mês e não tem "próxima".
 */
export interface NextBillDto {
  id: number;
  title: string;
  categoryName: string;
  color: string;
  amount: number;
  /** Mês da cobrança, 'YYYY-MM'. */
  month: string;
  /** Vencimento, 'YYYY-MM-DD'. */
  dueDate: string;
  daysUntil: number;
}

export interface OverdueSummaryDto {
  total: number;
  count: number;
  items: OverdueBillDto[];
  next: NextBillDto | null;
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

// ------------------------------------------------- lançamentos do mês

/**
 * Um lançamento qualquer do mês, na forma que a lista única de "Lançamentos"
 * e o Início consomem. Carrega o DTO original para a edição reaproveitar os
 * formulários de fixo e variável sem nova ida ao servidor.
 */
export type MonthEntryDto =
  | { key: string; source: 'fixed'; kind: EntryKind; entry: FixedEntryDto }
  | { key: string; source: 'variable'; kind: EntryKind; entry: VariableEntryDto };
