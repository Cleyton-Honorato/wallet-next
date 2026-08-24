'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatDateForInput } from '@/lib/format';
import type { CategoryDto, EntryKind, FixedEntryDto } from '@/lib/types';
import { ENTRY_LABELS } from '../labels';
import styles from './Entries.module.css';

/** Espelha `fixedEntrySchema`, mas com os tipos que um <form> produz. */
const formSchema = z.object({
  categoryId: z.string().min(1, 'Selecione uma categoria'),
  title: z.string().trim().min(1, 'Informe o título').max(120),
  amount: z.coerce.number().positive('Informe um valor positivo'),
  day: z.coerce.number().int().min(1).max(31),
  startDate: z.string().min(1, 'Informe a data de início'),
  endDate: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean(),
});

/**
 * `z.coerce` faz entrada e saída divergirem (o input do <input type="number">
 * é string, a saída é number), por isso os dois tipos.
 */
type FormInput = z.input<typeof formSchema>;
export type FixedEntryFormValues = z.output<typeof formSchema>;

interface FixedEntryFormProps {
  kind: EntryKind;
  categories: CategoryDto[];
  initial?: FixedEntryDto;
  error: string | null;
  isSubmitting: boolean;
  onSubmit: (values: FixedEntryFormValues) => void;
  onCancel: () => void;
}

export function FixedEntryForm({
  kind,
  categories,
  initial,
  error,
  isSubmitting,
  onSubmit,
  onCancel,
}: FixedEntryFormProps) {
  const labels = ENTRY_LABELS[kind];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput, unknown, FixedEntryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: String(initial?.categoryId ?? categories[0]?.id ?? ''),
      title: initial?.title ?? '',
      amount: initial?.amount ?? 0,
      day: initial?.day ?? 1,
      startDate: initial?.startDate ?? formatDateForInput(new Date()),
      endDate: initial?.endDate ?? '',
      description: initial?.description ?? '',
      isActive: initial?.isActive ?? true,
    },
  });

  const categoryOptions = categories.map((category) => ({
    value: String(category.id),
    label: category.name,
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {error && <div className={styles.formError}>{error}</div>}

      <div className={styles.formGrid}>
        <div className={styles.formGridFull}>
          <Input
            id="fixed-title"
            label="Título"
            {...register('title')}
            error={errors.title?.message}
          />
        </div>

        <Select
          id="fixed-category"
          label="Categoria"
          options={categoryOptions}
          {...register('categoryId')}
        />

        <Input
          id="fixed-amount"
          label="Valor (R$)"
          type="number"
          step="0.01"
          min="0"
          {...register('amount')}
          error={errors.amount?.message}
        />

        <Input
          id="fixed-day"
          label={labels.dayLabel}
          type="number"
          min="1"
          max="31"
          {...register('day')}
          error={errors.day?.message}
        />

        <Input
          id="fixed-start-date"
          label="Início"
          type="date"
          {...register('startDate')}
          error={errors.startDate?.message}
        />

        <Input
          id="fixed-end-date"
          label="Término (opcional)"
          type="date"
          {...register('endDate')}
        />

        <div className={styles.formGridFull}>
          <label className={styles.fieldLabel} htmlFor="fixed-description">
            Descrição (opcional)
          </label>
          <textarea
            id="fixed-description"
            className={styles.textarea}
            {...register('description')}
          />
        </div>

        <div className={styles.formGridFull}>
          <label className={styles.checkboxRow}>
            <input type="checkbox" {...register('isActive')} />
            {kind === 'expense' ? 'Despesa ativa' : 'Receita ativa'}
          </label>
        </div>
      </div>

      <div className={styles.formActions}>
        <Button variant="ghost" type="button" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="primary" type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? 'Salvando…'
            : initial
              ? 'Salvar alterações'
              : labels.submitNew}
        </Button>
      </div>
    </form>
  );
}
