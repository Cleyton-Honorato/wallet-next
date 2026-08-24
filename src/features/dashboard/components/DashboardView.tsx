'use client';

import { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import {
  capitalize,
  formatPeriodLabel,
  type DashboardPeriod,
} from '@/lib/period-label';
import type {
  DashboardMatrixDto,
  DashboardSummaryDto,
  EmergencyFundDto,
} from '@/lib/types';
import { EmergencyFundModal } from '@/features/emergency-fund/components/EmergencyFundModal';
import { AnnualMatrixPanel } from './AnnualMatrixPanel';
import { BalanceHeroCard } from './BalanceHeroCard';
import { DashboardToolbar } from './DashboardToolbar';
import { ExpensesByCategoryPieChart } from './ExpensesByCategoryPieChart';
import { MiniStatCard } from './MiniStatCard';
import { MonthlyBudgetPanel } from './MonthlyBudgetPanel';
import { NewTransactionModal } from './NewTransactionModal';
import { RecentTransactionsPanel } from './RecentTransactionsPanel';
import styles from './DashboardPage.module.css';

const FALLBACK_CATEGORIES = [
  'Moradia',
  'Mercado',
  'Alimentação',
  'Transporte',
  'Lazer',
];

interface DashboardViewProps {
  period: DashboardPeriod;
  summary: DashboardSummaryDto;
  matrix: DashboardMatrixDto;
  fund: EmergencyFundDto;
}

export function DashboardView({
  period,
  summary,
  matrix,
  fund,
}: DashboardViewProps) {
  const [isNewTxOpen, setNewTxOpen] = useState(false);
  const [isReserveOpen, setReserveOpen] = useState(false);

  const periodLabel = capitalize(formatPeriodLabel(period));
  const subtitle = `${periodLabel} · resumo do ${period.month ? 'mês' : 'ano'}`;

  const categoryNames = summary.expensesByCategory.map((c) => c.categoryName);
  const modalCategories =
    categoryNames.length > 0 ? categoryNames : FALLBACK_CATEGORIES;

  return (
    <div className={styles.page}>
      <DashboardToolbar
        subtitle={subtitle}
        period={period}
        onNewTransaction={() => setNewTxOpen(true)}
      />

      {/* Linha de indicadores — os três números de leitura rápida. */}
      <div className={styles.statsRow}>
        <MiniStatCard
          title="Receitas"
          value={formatCurrency(summary.income.total)}
          subtitle={`Fixas ${formatCurrency(summary.income.fixed)} · Variáveis ${formatCurrency(summary.income.variable)}`}
          variant="income"
          icon={<ArrowUpRight size={18} />}
        />
        <MiniStatCard
          title="Despesas"
          value={formatCurrency(summary.expenses.total)}
          subtitle={`Fixas ${formatCurrency(summary.expenses.fixed)} · Variáveis ${formatCurrency(summary.expenses.variable)}`}
          variant="expense"
          icon={<ArrowDownRight size={18} />}
        />
        <MiniStatCard
          title="Investimentos"
          value={formatCurrency(summary.investments.totalValue)}
          subtitle={`Mov. período ${formatCurrency(summary.investments.periodMovements)}`}
          variant="investment"
          icon={<TrendingUp size={18} />}
        />
      </div>

      {/* Saldo e extrato à esquerda, medidor de categorias à direita. */}
      <div className={styles.primaryRow}>
        <div className={styles.primaryMain}>
          <BalanceHeroCard
            balance={summary.balance}
            periodLabel={periodLabel}
            emergencyFund={summary.emergencyFund}
            onManageReserve={() => setReserveOpen(true)}
          />
          <RecentTransactionsPanel
            onNewTransaction={() => setNewTxOpen(true)}
          />
        </div>
        <ExpensesByCategoryPieChart data={summary.expensesByCategory} />
      </div>

      <MonthlyBudgetPanel budget={summary.monthlyBudget} />

      <AnnualMatrixPanel matrix={matrix} />

      {isNewTxOpen && (
        <NewTransactionModal
          categories={modalCategories}
          onClose={() => setNewTxOpen(false)}
        />
      )}

      {isReserveOpen && (
        <EmergencyFundModal
          fund={fund}
          onClose={() => setReserveOpen(false)}
        />
      )}
    </div>
  );
}
