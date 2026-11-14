'use client';

import { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FixedEntryForm, type FixedEntryFormValues } from '@/features/entries/components/FixedEntryForm';
import {
  VariableEntryForm,
  type VariableEntryFormValues,
} from '@/features/entries/components/VariableEntryForm';
import { parseTagsInput } from '@/lib/format';
import type { CategoryDto, MonthEntryDto } from '@/lib/types';
import {
  deleteFixedEntryAction,
  deleteVariableEntryAction,
  updateFixedEntryAction,
  updateVariableEntryAction,
} from '@/server/actions/entries';
import styles from './Transactions.module.css';

interface EditEntryModalProps {
  item: MonthEntryDto;
  monthKey: string;
  categories: CategoryDto[];
  onClose: () => void;
}

/** Edição completa de um lançamento, com os formulários de fixo e variável. */
export function EditEntryModal({ item, monthKey, categories, onClose }: EditEntryModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isExpense = item.kind === 'expense';
  const options = categories.filter((c) => c.type === (isExpense ? 'EXPENSE' : 'INCOME'));
  const title = `Editar ${isExpense ? 'gasto' : 'entrada'}`;
  const subtitle = item.source === 'fixed' ? 'Repete todo mês' : 'Só neste mês';

  const finish = (result: { ok: boolean; error?: string }) => {
    if (result.ok) onClose();
    else setError(result.error ?? 'Algo deu errado.');
  };

  const submitFixed = (values: FixedEntryFormValues) => {
    if (item.source !== 'fixed') return;
    setError(null);
    startTransition(async () => {
      finish(
        await updateFixedEntryAction(item.kind, {
          id: item.entry.id,
          categoryId: Number(values.categoryId),
          title: values.title,
          amount: values.amount,
          day: values.day,
          startDate: values.startDate,
          endDate: values.endDate || null,
          description: values.description || undefined,
          isActive: values.isActive,
        }),
      );
    });
  };

  const submitVariable = (values: VariableEntryFormValues) => {
    if (item.source !== 'variable') return;
    setError(null);
    startTransition(async () => {
      const raw = values.actualAmount;
      const actual = raw === '' || raw === undefined ? undefined : Number(raw);
      finish(
        await updateVariableEntryAction(item.kind, {
          id: item.entry.id,
          categoryId: Number(values.categoryId),
          title: values.title,
          estimatedAmount: values.estimatedAmount,
          // Ao quitar sem informar o valor, assume-se o previsto.
          actualAmount: values.settled ? (actual ?? values.estimatedAmount) : null,
          description: values.description || undefined,
          month: item.entry.month,
          settled: values.settled,
          tags: parseTagsInput(values.tags ?? ''),
        }),
      );
    });
  };

  const handleDelete = () => {
    const extra = item.source === 'fixed' ? ' Ele some de todos os meses.' : '';
    if (!window.confirm(`Excluir "${item.entry.title}"?${extra}`)) return;
    setError(null);
    startTransition(async () => {
      finish(
        item.source === 'fixed'
          ? await deleteFixedEntryAction(item.kind, { id: item.entry.id })
          : await deleteVariableEntryAction(item.kind, { id: item.entry.id }),
      );
    });
  };

  return (
    <Modal title={title} subtitle={subtitle} onClose={onClose}>
      {item.source === 'fixed' ? (
        <FixedEntryForm
          kind={item.kind}
          categories={options}
          initial={item.entry}
          error={error}
          isSubmitting={isPending}
          onSubmit={submitFixed}
          onCancel={onClose}
        />
      ) : (
        <VariableEntryForm
          kind={item.kind}
          categories={options}
          monthKey={item.entry.month || monthKey}
          initial={item.entry}
          error={error}
          isSubmitting={isPending}
          onSubmit={submitVariable}
          onCancel={onClose}
        />
      )}

      <div className={styles.deleteZone}>
        <Button
          variant="danger"
          block
          icon={<Trash2 size={18} />}
          onClick={handleDelete}
          disabled={isPending}
        >
          Excluir lançamento
        </Button>
      </div>
    </Modal>
  );
}
