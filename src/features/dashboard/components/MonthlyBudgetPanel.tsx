import Link from 'next/link';
import { Panel } from '@/components/ui/Panel';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';
import { capitalize, formatMonthLabel } from '@/lib/period-label';
import type { DashboardSummaryDto } from '@/lib/types';
import styles from './MonthlyBudgetPanel.module.css';

export function MonthlyBudgetPanel({
  budget,
}: {
  budget: DashboardSummaryDto['monthlyBudget'];
}) {
  return (
    <Panel
      title="Orçamento mensal"
      action={
        <span className={styles.action}>
          <span className={styles.month}>
            {capitalize(formatMonthLabel(budget.month))}
          </span>
          <Link href={`/budgets?month=${budget.month}`} className={styles.link}>
            Gerenciar
          </Link>
        </span>
      }
    >
      {budget.lines.length === 0 ? (
        <p className={styles.empty}>
          Nenhum orçamento definido para este mês.
        </p>
      ) : (
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
                  <span className={styles.linePct}>{line.usagePercent}%</span>
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
                  <span className={cn(styles.status, over && styles.over)}>
                    {over ? 'Acima do limite' : 'Dentro do limite'}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
