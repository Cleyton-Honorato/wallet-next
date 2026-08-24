'use client';

import { useOptimistic, useTransition } from 'react';
import { Panel } from '@/components/ui/Panel';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';
import { toMonthKey } from '@/lib/month';
import type {
  DashboardMatrixDto,
  MatrixCellStatus,
  MatrixRowDto,
  MatrixRowType,
  MatrixSectionDto,
} from '@/lib/types';
import {
  bulkSettleVariableEntriesAction,
  settleFixedEntryAction,
} from '@/server/actions/entries';
import styles from './AnnualMatrixPanel.module.css';

const MONTH_LABELS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

const statusClass: Record<MatrixCellStatus, string> = {
  none: '',
  pending: styles.pending,
  overdue: styles.overdue,
  partial: styles.partial,
  paid: styles.paid,
};

const cellKeyOf = (rowId: string, monthIndex: number) =>
  `${rowId}:${monthIndex}`;

function Legend() {
  return (
    <div className={styles.legend}>
      <span className={styles.legendItem}>
        <span className={cn(styles.legendSwatch, styles.swatchPaid)} />
        Quitado
      </span>
      <span className={styles.legendItem}>
        <span className={cn(styles.legendSwatch, styles.swatchPartial)} />
        Parcial
      </span>
      <span className={styles.legendItem}>
        <span className={cn(styles.legendSwatch, styles.swatchOverdue)} />
        Vencida
      </span>
      <span className={styles.legendItem}>
        <span className={cn(styles.legendSwatch, styles.swatchPending)} />
        Pendente
      </span>
    </div>
  );
}

export function AnnualMatrixPanel({ matrix }: { matrix: DashboardMatrixDto }) {
  const { year } = matrix;
  const [, startTransition] = useTransition();

  /**
   * Sobreposição otimista: a célula muda de cor no clique e o
   * `revalidatePath` da action reconcilia com o servidor logo depois.
   */
  const [overrides, applyOverride] = useOptimistic<
    Record<string, MatrixCellStatus>,
    { key: string; status: MatrixCellStatus }
  >({}, (state, change) => ({ ...state, [change.key]: change.status }));

  const now = new Date();
  const currentMonthIndex = now.getFullYear() === year ? now.getMonth() : -1;

  const visibleSections = matrix.sections.filter(
    (section) => section.rows.length > 0,
  );

  const toggleCell = (
    row: MatrixRowDto,
    monthIndex: number,
    status: MatrixCellStatus,
  ) => {
    if (status === 'none') return;

    const month = toMonthKey(year, monthIndex + 1);
    // Uma célula parcialmente quitada completa a quitação; só a totalmente
    // quitada é reaberta.
    const settled = status !== 'paid';

    startTransition(async () => {
      applyOverride({
        key: cellKeyOf(row.id, monthIndex),
        status: settled ? 'paid' : 'pending',
      });

      const { rowType, refId } = row;
      switch (rowType satisfies MatrixRowType) {
        case 'fixedExpense':
          await settleFixedEntryAction('expense', { id: refId, month, settled });
          break;
        case 'variableExpenseCategory':
          await bulkSettleVariableEntriesAction('expense', {
            categoryId: refId,
            month,
            settled,
          });
          break;
        case 'fixedIncome':
          await settleFixedEntryAction('income', { id: refId, month, settled });
          break;
        case 'variableIncomeCategory':
          await bulkSettleVariableEntriesAction('income', {
            categoryId: refId,
            month,
            settled,
          });
          break;
      }
    });
  };

  const hasData = visibleSections.length > 0;

  return (
    <Panel
      title={`Contas do ano · ${year}`}
      action={hasData ? <Legend /> : undefined}
    >
      {!hasData ? (
        <p className={styles.state}>
          Nenhum lançamento em {year}. Cadastre despesas ou receitas para ver a
          tabela.
        </p>
      ) : (
        <div className={styles.scroll}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.headRow}>
                <th className={cn(styles.corner, styles.labelCell)}>Conta</th>
                {MONTH_LABELS.map((label, i) => (
                  <th
                    key={label}
                    className={cn(
                      styles.num,
                      i === currentMonthIndex && styles.currentMonth,
                    )}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleSections.map((section) => (
                <SectionGroup
                  key={section.key}
                  section={section}
                  overrides={overrides}
                  currentMonthIndex={currentMonthIndex}
                  onToggleCell={toggleCell}
                />
              ))}

              <tr className={styles.totalRow}>
                <td className={styles.labelCell}>Total de despesas</td>
                {matrix.totals.expenses.map((value, i) => (
                  <td
                    key={i}
                    className={cn(
                      styles.num,
                      i === currentMonthIndex && styles.currentMonth,
                    )}
                  >
                    {formatCurrency(value)}
                  </td>
                ))}
              </tr>
              <tr className={styles.leftoverRow}>
                <td className={styles.labelCell}>O que sobrou</td>
                {matrix.totals.leftover.map((value, i) => (
                  <td
                    key={i}
                    className={cn(
                      styles.num,
                      i === currentMonthIndex && styles.currentMonth,
                    )}
                  >
                    <span
                      className={cn(
                        styles.pill,
                        value >= 0 ? styles.pillPositive : styles.pillNegative,
                      )}
                    >
                      {formatCurrency(value)}
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function SectionGroup({
  section,
  overrides,
  currentMonthIndex,
  onToggleCell,
}: {
  section: MatrixSectionDto;
  overrides: Record<string, MatrixCellStatus>;
  currentMonthIndex: number;
  onToggleCell: (
    row: MatrixRowDto,
    monthIndex: number,
    status: MatrixCellStatus,
  ) => void;
}) {
  return (
    <>
      <tr className={styles.sectionRow}>
        <td className={styles.labelCell}>
          <span
            className={cn(
              styles.sectionDot,
              section.kind === 'income' ? styles.incomeDot : styles.expenseDot,
            )}
          />
          {section.title}
        </td>
        <td className={styles.sectionFill} colSpan={12} />
      </tr>
      {section.rows.map((row) => (
        <DataRow
          key={row.id}
          row={row}
          overrides={overrides}
          currentMonthIndex={currentMonthIndex}
          onToggleCell={onToggleCell}
        />
      ))}
    </>
  );
}

function DataRow({
  row,
  overrides,
  currentMonthIndex,
  onToggleCell,
}: {
  row: MatrixRowDto;
  overrides: Record<string, MatrixCellStatus>;
  currentMonthIndex: number;
  onToggleCell: (
    row: MatrixRowDto,
    monthIndex: number,
    status: MatrixCellStatus,
  ) => void;
}) {
  return (
    <tr className={styles.dataRow}>
      <td className={styles.labelCell} title={row.label}>
        {row.label}
      </td>
      {row.values.map((value, i) => {
        const serverStatus = row.statuses[i];
        // Célula inativa nunca ganha sobreposição.
        const status =
          serverStatus === 'none'
            ? 'none'
            : (overrides[cellKeyOf(row.id, i)] ?? serverStatus);
        const interactive = status !== 'none';

        return (
          <td
            key={i}
            className={cn(
              styles.num,
              statusClass[status],
              interactive && styles.clickable,
              i === currentMonthIndex &&
                status === 'none' &&
                styles.currentMonth,
            )}
            onClick={
              interactive ? () => onToggleCell(row, i, status) : undefined
            }
            title={
              interactive
                ? status === 'paid'
                  ? 'Quitado — clique para reabrir'
                  : status === 'overdue'
                    ? 'Vencida — clique para marcar como quitado'
                    : 'Clique para marcar como quitado'
                : undefined
            }
          >
            {value ? (
              formatCurrency(value)
            ) : (
              <span className={styles.zero}>–</span>
            )}
          </td>
        );
      })}
    </tr>
  );
}
