'use client';

import { useState, useTransition } from 'react';
import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Panel } from '@/components/ui/Panel';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDueDay, formatPeriodRange } from '@/lib/format';
import type { CategoryDto, EntryKind, FixedEntryDto } from '@/lib/types';
import {
  createFixedEntryAction,
  deleteFixedEntryAction,
  settleFixedEntryAction,
  updateFixedEntryAction,
} from '@/server/actions/entries';
import { ENTRY_LABELS } from '../labels';
import { CategoryBadge } from './CategoryBadge';
import { FixedEntryForm, type FixedEntryFormValues } from './FixedEntryForm';
import { MonthNavigator } from './MonthNavigator';
import styles from './Entries.module.css';

interface FixedEntriesViewProps {
  kind: EntryKind;
  monthKey: string;
  entries: FixedEntryDto[];
  categories: CategoryDto[];
}

export function FixedEntriesView({
  kind,
  monthKey,
  entries,
  categories,
}: FixedEntriesViewProps) {
  const labels = ENTRY_LABELS[kind];
  const isExpense = kind === 'expense';

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FixedEntryDto | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const active = entries.filter((entry) => entry.isActive);
  const totals = {
    total: active.reduce((sum, entry) => sum + entry.amount, 0),
    activeCount: active.length,
    totalCount: entries.length,
    settledCount: active.filter((entry) => entry.settled).length,
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setFormError(null);
  };

  const handleSubmit = (values: FixedEntryFormValues) => {
    setFormError(null);
    startTransition(async () => {
      const payload = {
        categoryId: Number(values.categoryId),
        title: values.title,
        amount: values.amount,
        day: values.day,
        startDate: values.startDate,
        endDate: values.endDate || null,
        description: values.description || undefined,
        isActive: values.isActive,
      };
      const result = editing
        ? await updateFixedEntryAction(kind, { id: editing.id, ...payload })
        : await createFixedEntryAction(kind, payload);

      if (result.ok) closeModal();
      else setFormError(result.error);
    });
  };

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setListError(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) setListError(result.error ?? 'Algo deu errado.');
    });
  };

  const handleDelete = (entry: FixedEntryDto) => {
    if (!window.confirm(`Excluir "${entry.title}"?`)) return;
    run(() => deleteFixedEntryAction(kind, { id: entry.id }));
  };

  const handleToggleActive = (entry: FixedEntryDto) =>
    run(() =>
      updateFixedEntryAction(kind, { id: entry.id, isActive: !entry.isActive }),
    );

  const handleToggleSettled = (entry: FixedEntryDto) =>
    run(() =>
      settleFixedEntryAction(kind, {
        id: entry.id,
        month: monthKey,
        settled: !entry.settled,
      }),
    );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.intro}>
          <h1 className={styles.title}>{labels.fixedTitle}</h1>
          <p className={styles.subtitle}>{labels.fixedSubtitle}</p>
        </div>
        <div className={styles.controls}>
          <MonthNavigator monthKey={monthKey} />
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            disabled={categories.length === 0}
          >
            {labels.newAction}
          </Button>
        </div>
      </div>

      {listError && <p className={styles.error}>{listError}</p>}

      {categories.length === 0 ? (
        <p className={styles.empty}>{labels.noCategories}</p>
      ) : (
        <>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <p className={styles.summaryLabel}>{labels.totalLabel}</p>
              <p
                className={cn(
                  styles.summaryValue,
                  isExpense
                    ? styles.summaryValueExpense
                    : styles.summaryValueIncome,
                )}
              >
                {formatCurrency(totals.total)}
              </p>
            </div>
            <div className={styles.summaryCard}>
              <p className={styles.summaryLabel}>{labels.activeLabel}</p>
              <p className={styles.summaryValue}>
                {totals.activeCount} de {totals.totalCount}
              </p>
            </div>
            <div className={styles.summaryCard}>
              <p className={styles.summaryLabel}>{labels.settledCountLabel}</p>
              <p className={styles.summaryValue}>
                {totals.settledCount} de {totals.activeCount}
              </p>
            </div>
          </div>

          <Panel title={labels.fixedPanelTitle}>
            {entries.length === 0 ? (
              <p className={styles.empty}>{labels.emptyFixed}</p>
            ) : (
              <div className={styles.list}>
                {entries.map((entry) => (
                  <article
                    key={entry.id}
                    className={cn(
                      styles.row,
                      !entry.isActive && styles.rowInactive,
                    )}
                  >
                    <div className={styles.rowMain}>
                      <span className={styles.rowTitle}>{entry.title}</span>
                      <div className={styles.rowMeta}>
                        <CategoryBadge
                          category={categoryMap.get(entry.categoryId)}
                        />
                        <span>{formatDueDay(entry.day)}</span>
                        <span>
                          {formatPeriodRange(entry.startDate, entry.endDate)}
                        </span>
                        <span
                          className={
                            entry.isActive
                              ? styles.statusActive
                              : styles.statusInactive
                          }
                        >
                          {entry.isActive ? 'Ativa' : 'Inativa'}
                        </span>
                        <span
                          className={
                            entry.settled
                              ? styles.statusPaid
                              : styles.statusPending
                          }
                        >
                          {entry.settled
                            ? labels.settledStatus
                            : labels.pendingStatus}
                        </span>
                      </div>
                      {entry.description && (
                        <span className={styles.rowMeta}>
                          {entry.description}
                        </span>
                      )}
                    </div>

                    <div className={styles.rowAmounts}>
                      <span
                        className={cn(
                          styles.amount,
                          !isExpense && styles.amountIncome,
                        )}
                      >
                        {formatCurrency(entry.amount)}
                      </span>
                      <span className={styles.amountMuted}>por mês</span>
                    </div>

                    <div className={styles.rowActions}>
                      <Button
                        variant={entry.settled ? 'ghost' : 'primary'}
                        size="sm"
                        onClick={() => handleToggleSettled(entry)}
                        disabled={isPending}
                      >
                        {entry.settled ? (
                          'Desfazer'
                        ) : (
                          <>
                            <Check size={16} /> {labels.settleAction}
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(entry)}
                        disabled={isPending}
                      >
                        {entry.isActive ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditing(entry);
                          setModalOpen(true);
                        }}
                        aria-label={`Editar ${entry.title}`}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(entry)}
                        aria-label={`Excluir ${entry.title}`}
                        disabled={isPending}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </Panel>
        </>
      )}

      {modalOpen && (
        <Modal
          title={
            editing ? labels.fixedModalTitleEdit : labels.fixedModalTitleNew
          }
          subtitle={labels.modalSubtitle}
          onClose={closeModal}
        >
          <FixedEntryForm
            key={editing?.id ?? 'new'}
            kind={kind}
            categories={categories}
            initial={editing ?? undefined}
            error={formError}
            isSubmitting={isPending}
            onSubmit={handleSubmit}
            onCancel={closeModal}
          />
        </Modal>
      )}
    </div>
  );
}
