'use client';

import { useState, useTransition } from 'react';
import { Copy, PiggyBank, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { BackLink } from '@/components/ui/BackLink';
import { MonthPill } from '@/components/ui/MonthPill';
import { getBudgetStatus } from '@/lib/budget';
import { cn } from '@/lib/cn';
import { brandTone } from '@/lib/palette';
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
        `Apagar os limites de ${monthLabel}? Categorias e lançamentos não são afetados.`,
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
      <BackLink href="/profile" label="Perfil" />
      <div className={styles.header}>
        <div className={styles.intro}>
          <h1 className={styles.title}>Limites de gasto</h1>
          <p className={styles.subtitle}>
            Diga quanto quer gastar em cada categoria e veja se está dentro
          </p>
        </div>
        <div className={styles.controls}>
          <MonthPill monthKey={monthKey} allowFuture />
          {hasBudget && (
            <Button
              variant="primary"
              icon={<Pencil size={16} />}
              onClick={() => setEditorOpen(true)}
            >
              Editar limites
            </Button>
          )}
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {!hasBudget ? (
        <Panel title={`Limites de ${monthLabel}`}>
          <div className={styles.empty}>
            <PiggyBank size={44} className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>
              Nenhum limite definido para {monthLabel}
            </p>
            <p className={styles.emptyText}>
              Ex.: no máximo R$ 800 em mercado. Você acompanha o quanto já
              gastou antes de o mês fechar.
            </p>
            <div className={styles.emptyActions}>
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => setEditorOpen(true)}
                disabled={categories.length === 0}
              >
                Definir limites
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
                Cadastre categorias de gasto antes de definir limites.
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

          <Panel title={`Limites de ${monthLabel}`}>
            <ul className={styles.lines}>
              {budget.lines.map((line) => {
                const over = line.spentAmount > line.plannedAmount;
                return (
                  <li key={line.categoryId} className={styles.line}>
                    <div className={styles.lineHead}>
                      <span
                        className={styles.dot}
                        style={{ backgroundColor: brandTone(line.color).color }}
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
                Apagar limites
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
