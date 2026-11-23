'use client';

import { useState, useTransition } from 'react';
import { Check, Inbox } from 'lucide-react';
import { MonthPill } from '@/components/ui/MonthPill';
import { EntryRow } from '@/features/entries/components/EntryRow';
import { QuickAdd } from '@/features/quick-add/QuickAdd';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';
import { byMostRecent, isMonthEntryOverdue, monthEntryAmount } from '@/lib/month-entry';
import type { CategoryDto, MonthEntryDto } from '@/lib/types';
import {
  settleFixedEntryAction,
  updateVariableEntryAction,
} from '@/server/actions/entries';
import { EditEntryModal } from './EditEntryModal';
import styles from './Transactions.module.css';

export type TransactionsFilter = 'all' | 'out' | 'in' | 'pending';

const FILTERS: { id: TransactionsFilter; label: string }[] = [
  { id: 'all', label: 'Tudo' },
  { id: 'out', label: 'Gastos' },
  { id: 'in', label: 'Entradas' },
  { id: 'pending', label: 'A pagar' },
];

interface TransactionsViewProps {
  monthKey: string;
  entries: MonthEntryDto[];
  categories: CategoryDto[];
  initialFilter: TransactionsFilter;
}

/**
 * Lista única do mês. Substitui as quatro telas antigas (despesa/receita ×
 * fixa/variável): o usuário vê tudo junto e filtra se quiser. "Todo mês" e
 * "Avulsos" são só seções — a distinção do domínio continua por baixo.
 */
export function TransactionsView({
  monthKey,
  entries,
  categories,
  initialFilter,
}: TransactionsViewProps) {
  const [filter, setFilter] = useState<TransactionsFilter>(initialFilter);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const editing = entries.find((e) => e.key === editingKey) ?? null;

  const totalIn = entries
    .filter((e) => e.kind === 'income')
    .reduce((sum, e) => sum + monthEntryAmount(e), 0);
  const totalOut = entries
    .filter((e) => e.kind === 'expense')
    .reduce((sum, e) => sum + monthEntryAmount(e), 0);
  const pendingCount = entries.filter((e) => e.kind === 'expense' && !e.entry.settled).length;

  const visible = entries.filter((e) => {
    if (filter === 'out') return e.kind === 'expense';
    if (filter === 'in') return e.kind === 'income';
    if (filter === 'pending') return e.kind === 'expense' && !e.entry.settled;
    return true;
  });

  const recurring = visible
    .filter((e) => e.source === 'fixed')
    .sort((a, b) =>
      a.source === 'fixed' && b.source === 'fixed' ? a.entry.day - b.entry.day : 0,
    );
  const oneOff = visible.filter((e) => e.source === 'variable').sort(byMostRecent);

  const toggleSettled = (item: MonthEntryDto) => {
    const next = !item.entry.settled;
    setError(null);
    setPendingKey(item.key);
    startTransition(async () => {
      const result =
        item.source === 'fixed'
          ? await settleFixedEntryAction(item.kind, {
              id: item.entry.id,
              month: monthKey,
              settled: next,
            })
          : await updateVariableEntryAction(item.kind, {
              id: item.entry.id,
              settled: next,
              actualAmount: next
                ? (item.entry.actualAmount ?? item.entry.estimatedAmount)
                : null,
            });
      setPendingKey(null);
      if (!result.ok) setError(result.error);
    });
  };

  const metaFor = (item: MonthEntryDto): { text: string; alert: boolean } => {
    const category = categoryMap.get(item.entry.categoryId)?.name ?? 'Sem categoria';
    const isExpense = item.kind === 'expense';
    if (isMonthEntryOverdue(item, monthKey)) {
      return { text: `Vencida · ${category}`, alert: true };
    }
    if (item.entry.settled) {
      return { text: `${isExpense ? 'Pago' : 'Recebido'} · ${category}`, alert: false };
    }
    if (item.source === 'fixed') {
      return {
        text: `${isExpense ? 'Vence' : 'Cai'} dia ${item.entry.day} · ${category}`,
        alert: false,
      };
    }
    return { text: `Previsto · ${category}`, alert: false };
  };

  const renderRow = (item: MonthEntryDto) => {
    const meta = metaFor(item);
    const settled = item.entry.settled;
    const isExpense = item.kind === 'expense';
    const label = settled
      ? `Desmarcar ${isExpense ? 'pagamento' : 'recebimento'} de ${item.entry.title}`
      : `Marcar ${item.entry.title} como ${isExpense ? 'pago' : 'recebido'}`;

    return (
      <EntryRow
        key={item.key}
        item={item}
        category={categoryMap.get(item.entry.categoryId)}
        meta={meta.text}
        alert={meta.alert}
        onOpen={() => setEditingKey(item.key)}
        trailing={
          <button
            type="button"
            className={cn(styles.check, settled && styles.checkOn)}
            aria-label={label}
            aria-pressed={settled}
            disabled={pendingKey === item.key}
            onClick={() => toggleSettled(item)}
          >
            <Check size={20} strokeWidth={3} />
          </button>
        }
      />
    );
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Lançamentos</h1>
        <MonthPill monthKey={monthKey} allowFuture />
      </header>

      <div className={styles.totals}>
        <div className={styles.total}>
          <span className={styles.totalLabel}>Entrou</span>
          <span className={cn(styles.totalValue, styles.totalIn)}>
            {formatCurrency(totalIn)}
          </span>
        </div>
        <div className={styles.total}>
          <span className={styles.totalLabel}>Saiu</span>
          <span className={styles.totalValue}>{formatCurrency(totalOut)}</span>
        </div>
      </div>

      <div className={styles.filters} role="group" aria-label="Filtrar lançamentos">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            className={cn(styles.filter, filter === f.id && styles.filterOn)}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
            {f.id === 'pending' && pendingCount > 0 && (
              <span className={styles.filterCount}>{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {visible.length === 0 ? (
        <section className={styles.empty}>
          <span className={styles.emptyIcon} aria-hidden>
            <Inbox size={26} />
          </span>
          <h2 className={styles.emptyTitle}>
            {filter === 'pending' ? 'Nada pendente. Tudo em dia!' : 'Nenhum lançamento aqui'}
          </h2>
          <p className={styles.emptyText}>
            {filter === 'pending'
              ? 'Todas as contas deste mês estão pagas.'
              : 'Toque em Anotar para registrar um gasto ou uma entrada.'}
          </p>
        </section>
      ) : (
        <>
          {recurring.length > 0 && (
            <section className={styles.section} aria-labelledby="recurring-title">
              <h2 id="recurring-title" className={styles.sectionTitle}>
                Todo mês
              </h2>
              <ul className={styles.list}>{recurring.map(renderRow)}</ul>
            </section>
          )}
          {oneOff.length > 0 && (
            <section className={styles.section} aria-labelledby="oneoff-title">
              <h2 id="oneoff-title" className={styles.sectionTitle}>
                Avulsos
              </h2>
              <ul className={styles.list}>{oneOff.map(renderRow)}</ul>
            </section>
          )}
        </>
      )}

      <QuickAdd trigger="fab" categories={categories} monthKey={monthKey} />

      {editing && (
        <EditEntryModal
          item={editing}
          monthKey={monthKey}
          categories={categories}
          onClose={() => setEditingKey(null)}
        />
      )}
    </div>
  );
}
