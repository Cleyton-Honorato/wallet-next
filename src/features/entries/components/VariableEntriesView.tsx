'use client';

import { useState, useTransition } from 'react';
import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Panel } from '@/components/ui/Panel';
import { cn } from '@/lib/cn';
import { formatCurrency, parseTagsInput } from '@/lib/format';
import type { CategoryDto, EntryKind, VariableEntryDto } from '@/lib/types';
import {
  createVariableEntryAction,
  deleteVariableEntryAction,
  updateVariableEntryAction,
} from '@/server/actions/entries';
import { ENTRY_LABELS } from '../labels';
import { CategoryBadge } from './CategoryBadge';
import { MonthNavigator } from './MonthNavigator';
import {
  VariableEntryForm,
  type VariableEntryFormValues,
} from './VariableEntryForm';
import styles from './Entries.module.css';

interface VariableEntriesViewProps {
  kind: EntryKind;
  monthKey: string;
  entries: VariableEntryDto[];
  categories: CategoryDto[];
}

export function VariableEntriesView({
  kind,
  monthKey,
  entries,
  categories,
}: VariableEntriesViewProps) {
  const labels = ENTRY_LABELS[kind];
  const isExpense = kind === 'expense';

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VariableEntryDto | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const totals = {
    estimated: entries.reduce((sum, e) => sum + e.estimatedAmount, 0),
    actual: entries.reduce(
      (sum, e) => sum + (e.actualAmount ?? e.estimatedAmount),
      0,
    ),
    settledCount: entries.filter((e) => e.settled).length,
    totalCount: entries.length,
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setFormError(null);
  };

  const handleSubmit = (values: VariableEntryFormValues) => {
    setFormError(null);
    startTransition(async () => {
      const raw = values.actualAmount;
      const actual = raw === '' || raw === undefined ? undefined : Number(raw);

      const payload = {
        categoryId: Number(values.categoryId),
        title: values.title,
        estimatedAmount: values.estimatedAmount,
        // Ao quitar sem informar o valor, assume-se o estimado.
        actualAmount: values.settled
          ? (actual ?? values.estimatedAmount)
          : null,
        description: values.description || undefined,
        month: monthKey,
        settled: values.settled,
        tags: parseTagsInput(values.tags ?? ''),
      };

      const result = editing
        ? await updateVariableEntryAction(kind, { id: editing.id, ...payload })
        : await createVariableEntryAction(kind, payload);

      if (result.ok) closeModal();
      else setFormError(result.error);
    });
  };

  const handleDelete = (entry: VariableEntryDto) => {
    if (!window.confirm(`Excluir "${entry.title}"?`)) return;
    setListError(null);
    startTransition(async () => {
      const result = await deleteVariableEntryAction(kind, { id: entry.id });
      if (!result.ok) setListError(result.error);
    });
  };

  const handleMarkSettled = (entry: VariableEntryDto) => {
    setListError(null);
    startTransition(async () => {
      const result = await updateVariableEntryAction(kind, {
        id: entry.id,
        settled: true,
        actualAmount: entry.actualAmount ?? entry.estimatedAmount,
      });
      if (!result.ok) setListError(result.error);
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.intro}>
          <h1 className={styles.title}>{labels.variableTitle}</h1>
          <p className={styles.subtitle}>{labels.variableSubtitle}</p>
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
              <p className={styles.summaryLabel}>Total estimado</p>
              <p
                className={cn(
                  styles.summaryValue,
                  isExpense
                    ? styles.summaryValueExpense
                    : styles.summaryValueIncome,
                )}
              >
                {formatCurrency(totals.estimated)}
              </p>
            </div>
            <div className={styles.summaryCard}>
              <p className={styles.summaryLabel}>Total efetivo</p>
              <p
                className={cn(
                  styles.summaryValue,
                  isExpense
                    ? styles.summaryValueExpense
                    : styles.summaryValueIncome,
                )}
              >
                {formatCurrency(totals.actual)}
              </p>
            </div>
            <div className={styles.summaryCard}>
              <p className={styles.summaryLabel}>
                {isExpense ? 'Pagas' : 'Recebidas'}
              </p>
              <p className={styles.summaryValue}>
                {totals.settledCount} de {totals.totalCount}
              </p>
            </div>
          </div>

          <Panel title={labels.variablePanelTitle}>
            {entries.length === 0 ? (
              <p className={styles.empty}>{labels.emptyVariable}</p>
            ) : (
              <div className={styles.list}>
                {entries.map((entry) => (
                  <article key={entry.id} className={styles.row}>
                    <div className={styles.rowMain}>
                      <span className={styles.rowTitle}>{entry.title}</span>
                      <div className={styles.rowMeta}>
                        <CategoryBadge
                          category={categoryMap.get(entry.categoryId)}
                        />
                        <span
                          className={
                            entry.settled
                              ? styles.statusPaid
                              : styles.statusPending
                          }
                        >
                          {entry.settled
                            ? isExpense
                              ? 'Paga'
                              : 'Recebida'
                            : labels.pendingStatus}
                        </span>
                      </div>
                      {entry.tags.length > 0 && (
                        <div className={styles.tagList}>
                          {entry.tags.map((tag) => (
                            <span key={tag} className={styles.tag}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
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
                        {formatCurrency(
                          entry.actualAmount ?? entry.estimatedAmount,
                        )}
                      </span>
                      <span className={styles.amountMuted}>
                        estimado {formatCurrency(entry.estimatedAmount)}
                      </span>
                    </div>

                    <div className={styles.rowActions}>
                      {!entry.settled && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkSettled(entry)}
                          disabled={isPending}
                        >
                          <Check size={16} />
                          {labels.settleAction}
                        </Button>
                      )}
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
            editing
              ? labels.variableModalTitleEdit
              : labels.variableModalTitleNew
          }
          subtitle={labels.modalSubtitle}
          onClose={closeModal}
        >
          <VariableEntryForm
            key={editing?.id ?? monthKey}
            kind={kind}
            categories={categories}
            monthKey={monthKey}
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
