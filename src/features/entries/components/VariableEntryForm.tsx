'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatTags } from '@/lib/format';
import type { CategoryDto, EntryKind, VariableEntryDto } from '@/lib/types';
import { ENTRY_LABELS } from '../labels';
import styles from './Entries.module.css';

const formSchema = z.object({
  categoryId: z.string().min(1, 'Selecione uma categoria'),
  title: z.string().trim().min(1, 'Informe o título').max(120),
  estimatedAmount: z.coerce.number().positive('Informe um valor positivo'),
  actualAmount: z
    .union([z.literal(''), z.coerce.number().positive('Informe um valor positivo')])
    .optional(),
  description: z.string().optional(),
  tags: z.string().optional(),
  settled: z.boolean(),
});

/** Entrada e saída divergem por causa do `z.coerce` nos campos numéricos. */
type FormInput = z.input<typeof formSchema>;
export type VariableEntryFormValues = z.output<typeof formSchema>;

interface VariableEntryFormProps {
  kind: EntryKind;
  categories: CategoryDto[];
  monthKey: string;
  initial?: VariableEntryDto;
  error: string | null;
  isSubmitting: boolean;
  onSubmit: (values: VariableEntryFormValues) => void;
  onCancel: () => void;
}

export function VariableEntryForm({
  kind,
  categories,
  monthKey,
  initial,
  error,
  isSubmitting,
  onSubmit,
  onCancel,
}: VariableEntryFormProps) {
  const labels = ENTRY_LABELS[kind];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormInput, unknown, VariableEntryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: String(initial?.categoryId ?? categories[0]?.id ?? ''),
      title: initial?.title ?? '',
      estimatedAmount: initial?.estimatedAmount ?? 0,
      actualAmount: initial?.actualAmount ?? '',
      description: initial?.description ?? '',
      tags: formatTags(initial?.tags),
      settled: initial?.settled ?? false,
    },
  });

  // O campo de valor efetivo só aparece depois de marcar como quitado.
  const settled = useWatch({ control, name: 'settled' });
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
            id="variable-title"
            label="Título"
            {...register('title')}
            error={errors.title?.message}
          />
        </div>

        <Select
          id="variable-category"
          label="Categoria"
          options={categoryOptions}
          {...register('categoryId')}
        />

        <div>
          <span className={styles.fieldLabel}>Mês</span>
          <p className={styles.rowMeta} style={{ marginTop: 'var(--space-1)' }}>
            {monthKey}
          </p>
        </div>

        <Input
          id="variable-estimated"
          label="Valor estimado (R$)"
          type="number"
          step="0.01"
          min="0"
          {...register('estimatedAmount')}
          error={errors.estimatedAmount?.message}
        />

        {settled && (
          <Input
            id="variable-actual"
            label={labels.amountPaidLabel}
            type="number"
            step="0.01"
            min="0"
            {...register('actualAmount')}
            error={errors.actualAmount?.message}
          />
        )}

        <div className={styles.formGridFull}>
          <Input
            id="variable-tags"
            label="Tags (separadas por vírgula)"
            placeholder="mercado, casa"
            {...register('tags')}
          />
        </div>

        <div className={styles.formGridFull}>
          <label className={styles.fieldLabel} htmlFor="variable-description">
            Descrição (opcional)
          </label>
          <textarea
            id="variable-description"
            className={styles.textarea}
            {...register('description')}
          />
        </div>

        <div className={styles.formGridFull}>
          <label className={styles.checkboxRow}>
            <input type="checkbox" {...register('settled')} />
            {labels.markAsSettled}
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
