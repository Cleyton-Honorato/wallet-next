'use client';

import { useId, useState, useTransition } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { formatCurrency } from '@/lib/format';
import type { CategoryDto, MonthlyBudgetDto } from '@/lib/types';
import { upsertBudgetAction } from '@/server/actions/budgets';
import styles from './Budgets.module.css';

/** Uma linha em edição: o valor fica como texto até o envio. */
interface DraftLine {
  categoryId: number;
  plannedAmount: string;
}

function buildInitialLines(budget: MonthlyBudgetDto): DraftLine[] {
  return budget.lines.map((line) => ({
    categoryId: line.categoryId,
    plannedAmount: String(line.plannedAmount),
  }));
}

interface BudgetEditorModalProps {
  monthLabel: string;
  month: string;
  budget: MonthlyBudgetDto;
  categories: CategoryDto[];
  onClose: () => void;
}

export function BudgetEditorModal({
  monthLabel,
  month,
  budget,
  categories,
  onClose,
}: BudgetEditorModalProps) {
  const fieldId = useId();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [lines, setLines] = useState<DraftLine[]>(() =>
    buildInitialLines(budget),
  );

  const usedIds = new Set(lines.map((line) => line.categoryId));
  const available = categories.filter((c) => !usedIds.has(c.id));

  const total = lines.reduce(
    (sum, line) => sum + (Number(line.plannedAmount) || 0),
    0,
  );

  const addLine = () => {
    const next = available[0];
    if (!next) return;
    setLines((prev) => [...prev, { categoryId: next.id, plannedAmount: '0' }]);
  };

  const updateLine = (index: number, patch: Partial<DraftLine>) => {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    );
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    startTransition(async () => {
      const result = await upsertBudgetAction({
        month,
        lines: lines.map((line) => ({
          categoryId: line.categoryId,
          plannedAmount: Number(line.plannedAmount) || 0,
        })),
      });
      if (result.ok) onClose();
      else setFormError(result.error);
    });
  };

  return (
    <Modal
      title={budget.id === null ? 'Criar orçamento' : 'Editar orçamento'}
      subtitle={`Defina quanto pretende gastar por categoria em ${monthLabel}.`}
      onClose={onClose}
      wide
    >
      <form onSubmit={handleSubmit}>
        {formError && <p className={styles.editorError}>{formError}</p>}

        {lines.length === 0 ? (
          <p className={styles.editorEmpty}>
            Nenhuma categoria no orçamento. Adicione ao menos uma para salvar.
          </p>
        ) : (
          <div className={styles.editorLines}>
            {lines.map((line, index) => {
              // A própria categoria da linha entra junto com as ainda livres.
              const options = categories.filter(
                (c) => c.id === line.categoryId || !usedIds.has(c.id),
              );
              return (
                <div key={line.categoryId} className={styles.editorRow}>
                  <Select
                    id={`${fieldId}-category-${index}`}
                    label="Categoria"
                    options={options.map((c) => ({
                      value: String(c.id),
                      label: c.name,
                    }))}
                    value={String(line.categoryId)}
                    onChange={(e) =>
                      updateLine(index, { categoryId: Number(e.target.value) })
                    }
                  />
                  <Input
                    id={`${fieldId}-amount-${index}`}
                    label="Planejado (R$)"
                    type="number"
                    step="0.01"
                    min="0"
                    value={line.plannedAmount}
                    onChange={(e) =>
                      updateLine(index, { plannedAmount: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => removeLine(index)}
                    aria-label="Remover categoria do orçamento"
                    title="Remover"
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className={styles.editorFoot}>
          <div>
            <Button
              variant="ghost"
              size="sm"
              icon={<Plus size={16} />}
              onClick={addLine}
              disabled={available.length === 0}
              title={
                available.length === 0
                  ? 'Todas as categorias de despesa já estão no orçamento'
                  : undefined
              }
            >
              Adicionar categoria
            </Button>
            <p className={styles.editorTotal}>
              Total planejado:{' '}
              <span className={styles.editorTotalValue}>
                {formatCurrency(total)}
              </span>
            </p>
          </div>

          <div className={styles.editorActions}>
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isPending || lines.length === 0}
            >
              {isPending ? 'Salvando…' : 'Salvar orçamento'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
