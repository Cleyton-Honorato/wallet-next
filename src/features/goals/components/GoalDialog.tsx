'use client';

import { useId, useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/cn';
import { BRAND_TONES, brandTone } from '@/lib/palette';
import type { GoalDto } from '@/lib/types';
import { createGoalAction, updateGoalAction } from '@/server/actions/goals';
import { AVAILABLE_GOAL_ICONS, GoalIcon, type GoalIconName } from '../icon-map';
import styles from './Goals.module.css';

interface FormState {
  name: string;
  targetAmount: string;
  targetDate: string;
  icon: GoalIconName;
  color: string;
}

function buildInitialState(editing: GoalDto | null): FormState {
  if (editing) {
    return {
      name: editing.name,
      targetAmount: String(editing.targetAmount),
      targetDate: editing.targetDate ?? '',
      icon: (editing.icon as GoalIconName | null) ?? AVAILABLE_GOAL_ICONS[0],
      // Cor antiga do banco já abre convertida para o tom da paleta.
      color: brandTone(editing.color).color,
    };
  }
  return {
    name: '',
    targetAmount: '',
    targetDate: '',
    icon: AVAILABLE_GOAL_ICONS[0],
    // Meta nova nasce azul, como as metas do mockup.
    color: BRAND_TONES.find((tone) => tone.id === 'azul')!.color,
  };
}

export function GoalDialog({
  editing,
  onClose,
}: {
  editing: GoalDto | null;
  onClose: () => void;
}) {
  const fieldId = useId();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => buildInitialState(editing));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const name = form.name.trim();
    const targetAmount = Number(form.targetAmount);
    if (!name || !Number.isFinite(targetAmount) || targetAmount <= 0) return;

    setFormError(null);
    startTransition(async () => {
      const payload = {
        name,
        color: form.color,
        icon: form.icon,
        targetAmount,
        targetDate: form.targetDate || null,
      };
      const result = editing
        ? await updateGoalAction({ id: editing.id, ...payload })
        : await createGoalAction(payload);

      if (result.ok) onClose();
      else setFormError(result.error);
    });
  };

  return (
    <Modal
      title={editing ? 'Editar meta' : 'Nova meta'}
      subtitle="Dê um nome, defina quanto quer juntar e, se quiser, até quando."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        {formError && <p className={styles.formError}>{formError}</p>}

        <div className={styles.fields}>
          <div className={styles.preview}>
            <div
              className={styles.iconBox}
              style={{ backgroundColor: brandTone(form.color).soft }}
            >
              <GoalIcon name={form.icon} size={22} color={form.color} />
            </div>
            <span className={styles.previewName}>
              {form.name || 'Nome da meta'}
            </span>
          </div>

          <Input
            id={`${fieldId}-name`}
            label="Nome"
            placeholder="Ex.: Viagem, Quitar dívida…"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
            autoFocus
            maxLength={80}
          />

          <div className={styles.row}>
            <Input
              id={`${fieldId}-target`}
              label="Quanto quer juntar (R$)"
              type="number"
              step="0.01"
              min="0"
              value={form.targetAmount}
              onChange={(e) =>
                setForm((p) => ({ ...p, targetAmount: e.target.value }))
              }
              placeholder="0,00"
              required
            />
            <div>
              <Input
                id={`${fieldId}-date`}
                label="Até quando (opcional)"
                type="date"
                value={form.targetDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, targetDate: e.target.value }))
                }
              />
              <p className={styles.hint}>
                Com um prazo, mostramos quanto guardar por mês.
              </p>
            </div>
          </div>

          <div>
            <span className={styles.fieldLabel}>Ícone</span>
            <div className={styles.iconGrid}>
              {AVAILABLE_GOAL_ICONS.map((iconName) => {
                const isActive = form.icon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    className={cn(
                      styles.iconBtn,
                      isActive && styles.iconBtnActive,
                    )}
                    onClick={() => setForm((p) => ({ ...p, icon: iconName }))}
                    title={iconName}
                    aria-pressed={isActive}
                  >
                    <GoalIcon
                      name={iconName}
                      size={20}
                      color={isActive ? form.color : undefined}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className={styles.fieldLabel}>Cor</span>
            <div className={styles.colorGrid}>
              {BRAND_TONES.map((tone) => (
                <button
                  key={tone.id}
                  type="button"
                  className={cn(
                    styles.colorCircle,
                    form.color === tone.color && styles.colorCircleActive,
                  )}
                  style={{ backgroundColor: tone.color }}
                  onClick={() => setForm((p) => ({ ...p, color: tone.color }))}
                  title={tone.name}
                  aria-label={`Cor ${tone.name}`}
                  aria-pressed={form.color === tone.color}
                />
              ))}
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={isPending}>
            {isPending
              ? 'Salvando…'
              : editing
                ? 'Salvar alterações'
                : 'Criar meta'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
