'use client';

import { useState, useTransition } from 'react';
import { Copy, PiggyBank, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { MonthNavigator } from '@/features/entries/components/MonthNavigator';
import { getBudgetStatus } from '@/lib/budget';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';
import { capitalize, formatMonthLabel } from '@/lib/period-label';
import type { CategoryDto, MonthlyBudgetDto } from '@/lib/types';
import {
  deleteBudgetAction,
  upsertBudgetAction,
} from '@/server/actions/budgets';
import { BudgetEditorModal } from './BudgetEditorModal';
import styles from './Budgets.module.css';

const STATUS_CLASS = {
  ok: styles.summaryValueOk,
  warning: styles.summaryValueWarning,
  over: styles.summaryValueOver,
} as const;

interface BudgetsViewProps {
  monthKey: string;
  budget: MonthlyBudgetDto;
  /** Linhas do mês anterior — origem do atalho "copiar". */
  previousLines: { categoryId: number; plannedAmount: number }[];
  previousMonthKey: string;
  categories: CategoryDto[];
}

export function BudgetsView({
  monthKey,
  budget,
  previousLines,
  previousMonthKey,
  categories,
}: BudgetsViewProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const monthLabel = capitalize(formatMonthLabel(monthKey));
  const hasBudget = budget.id !== null;

  const copyFromPrevious = () => {
    setError(null);
    startTransition(async () => {
      const result = await upsertBudgetAction({
        month: monthKey,
        lines: previousLines,
      });
      if (!result.ok) setError(result.error);
    });
  };

  const handleDelete = () => {
    if (
      !window.confirm(
        `Excluir o orçamento de ${monthLabel}? As categorias e os lançamentos não são afetados.`,
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteBudgetAction({ month: monthKey });
      if (!result.ok) setError(result.error);
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.intro}>
          <h1 className={styles.title}>Orçamentos</h1>
          <p className={styles.subtitle}>
            Defina quanto pretende gastar por categoria e acompanhe o mês
          </p>
        </div>
        <div className={styles.controls}>
          <MonthNavigator monthKey={monthKey} allowFuture />
          {hasBudget && (
            <Button
              variant="primary"
              icon={<Pencil size={16} />}
              onClick={() => setEditorOpen(true)}
            >
              Editar orçamento
            </Button>
          )}
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {!hasBudget ? (
        <Panel title={`Orçamento de ${monthLabel}`}>
          <div className={styles.empty}>
            <PiggyBank size={44} className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>
              Nenhum orçamento definido para {monthLabel}
            </p>
            <p className={styles.emptyText}>
              Um orçamento define um limite de gasto por categoria. Com ele,
              você acompanha o quanto já foi consumido antes de o mês fechar.
            </p>
            <div className={styles.emptyActions}>
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => setEditorOpen(true)}
                disabled={categories.length === 0}
              >
                Criar orçamento
              </Button>
              {previousLines.length > 0 && (
                <Button
                  variant="secondary"
                  icon={<Copy size={16} />}
                  onClick={copyFromPrevious}
                  disabled={isPending}
                >
                  {isPending
                    ? 'Copiando…'
                    : `Copiar de ${capitalize(formatMonthLabel(previousMonthKey))}`}
                </Button>
              )}
            </div>
            {categories.length === 0 && (
              <p className={styles.emptyText}>
                Cadastre categorias de despesa antes de montar um orçamento.
              </p>
            )}
          </div>
        </Panel>
      ) : (
        <>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <p className={styles.summaryLabel}>Planejado</p>
              <p className={styles.summaryValue}>
                {formatCurrency(budget.totalPlanned)}
              </p>
            </div>
            <div className={styles.summaryCard}>
              <p className={styles.summaryLabel}>Gasto</p>
              <p className={cn(styles.summaryValue, styles.summaryValueExpense)}>
                {formatCurrency(budget.totalSpent)}
              </p>
            </div>
            <div className={styles.summaryCard}>
              <p className={styles.summaryLabel}>Restante</p>
              <p className={styles.summaryValue}>
                {formatCurrency(budget.totalRemaining)}
              </p>
            </div>
            <div className={styles.summaryCard}>
              <p className={styles.summaryLabel}>Consumido</p>
              <p
                className={cn(
                  styles.summaryValue,
                  STATUS_CLASS[getBudgetStatus(budget.usagePercent)],
                )}
              >
                {budget.usagePercent}%
              </p>
            </div>
          </div>

          <Panel title={`Orçamento de ${monthLabel}`}>
            <ul className={styles.lines}>
              {budget.lines.map((line) => {
                const over = line.spentAmount > line.plannedAmount;
                return (
                  <li key={line.categoryId} className={styles.line}>
                    <div className={styles.lineHead}>
                      <span
                        className={styles.dot}
                        style={{ backgroundColor: line.color }}
                        aria-hidden
                      />
                      <span className={styles.categoryName}>
                        {line.categoryName}
                      </span>
                      <span className={styles.linePct}>
                        {line.usagePercent}%
                      </span>
                    </div>
                    <ProgressBar
                      value={line.spentAmount}
                      max={line.plannedAmount}
                    />
                    <div className={styles.lineFoot}>
                      <span className={styles.amounts}>
                        {formatCurrency(line.spentAmount)} de{' '}
                        {formatCurrency(line.plannedAmount)}
                      </span>
                      <span
                        className={cn(styles.status, over && styles.statusOver)}
                      >
                        {over
                          ? `Excedeu ${formatCurrency(line.spentAmount - line.plannedAmount)}`
                          : `Restam ${formatCurrency(line.remaining)}`}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className={styles.footer}>
              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 size={16} />}
                onClick={handleDelete}
                disabled={isPending}
              >
                Excluir orçamento
              </Button>
            </div>
          </Panel>
        </>
      )}

      {editorOpen && (
        <BudgetEditorModal
          month={monthKey}
          monthLabel={monthLabel}
          budget={budget}
          categories={categories}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </div>
  );
}
