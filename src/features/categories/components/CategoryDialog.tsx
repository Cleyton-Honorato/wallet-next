'use client';

import { useId, useState, useTransition } from 'react';
import { ModalShell } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/cn';
import type { CategoryDto, CategoryType } from '@/lib/types';
import {
  createCategoryAction,
  updateCategoryAction,
} from '@/server/actions/categories';
import {
  AVAILABLE_COLORS,
  AVAILABLE_ICONS,
  CategoryIcon,
  type CategoryIconName,
} from '../icon-map';
import styles from './CategoryDialog.module.css';

interface FormState {
  name: string;
  type: CategoryType;
  icon: CategoryIconName;
  color: string;
}

function buildInitialState(
  defaultType: CategoryType,
  editing: CategoryDto | null,
): FormState {
  if (editing) {
    return {
      name: editing.name,
      type: editing.type,
      icon:
        (editing.icon as CategoryIconName | null) ??
        AVAILABLE_ICONS[editing.type][0],
      color: editing.color,
    };
  }
  return {
    name: '',
    type: defaultType,
    icon: AVAILABLE_ICONS[defaultType][0],
    color: AVAILABLE_COLORS[0],
  };
}

interface CategoryDialogProps {
  onClose: () => void;
  editing: CategoryDto | null;
  defaultType: CategoryType;
}

export function CategoryDialog({
  onClose,
  editing,
  defaultType,
}: CategoryDialogProps) {
  const titleId = useId();
  const formId = useId();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() =>
    buildInitialState(defaultType, editing),
  );

  const handleTypeChange = (type: CategoryType) => {
    setForm((prev) => ({ ...prev, type, icon: AVAILABLE_ICONS[type][0] }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) return;

    setFormError(null);
    startTransition(async () => {
      const payload = {
        name,
        color: form.color,
        icon: form.icon,
        type: form.type,
      };
      const result = editing
        ? await updateCategoryAction({ id: editing.id, ...payload })
        : await createCategoryAction(payload);

      if (result.ok) onClose();
      else setFormError(result.error);
    });
  };

  const icons = AVAILABLE_ICONS[form.type];

  return (
    <ModalShell
      labelledBy={titleId}
      onClose={onClose}
      className={styles.dialog}
    >
      <div className={styles.header}>
        <h3 id={titleId} className={styles.title}>
          {editing ? 'Editar categoria' : 'Nova categoria'}
        </h3>
        <p className={styles.description}>
          {editing
            ? 'Edite as informações da categoria.'
            : 'Crie uma nova categoria para organizar suas transações.'}
        </p>
      </div>

      <div className={styles.body}>
        <form id={formId} className={styles.form} onSubmit={handleSubmit}>
          {formError && <p className={styles.formError}>{formError}</p>}

          <div className={styles.preview}>
            <div
              className={styles.previewIcon}
              style={{ backgroundColor: `${form.color}22` }}
            >
              <CategoryIcon name={form.icon} size={20} color={form.color} />
            </div>
            <span className={styles.previewName}>
              {form.name || 'Nome da categoria'}
            </span>
          </div>

          <Input
            id="category-name"
            label="Nome"
            placeholder="Ex: Alimentação, Salário…"
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
            required
            autoFocus
            maxLength={60}
          />

          <div>
            <span className={styles.fieldLabel}>Tipo</span>
            <div className={styles.radioGroup}>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="category-type"
                  value="INCOME"
                  checked={form.type === 'INCOME'}
                  onChange={() => handleTypeChange('INCOME')}
                />
                <span className={styles.radioIncome}>Receita</span>
              </label>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="category-type"
                  value="EXPENSE"
                  checked={form.type === 'EXPENSE'}
                  onChange={() => handleTypeChange('EXPENSE')}
                />
                <span className={styles.radioExpense}>Despesa</span>
              </label>
            </div>
          </div>

          <div>
            <span className={styles.fieldLabel}>Ícone</span>
            <div className={styles.iconGrid}>
              {icons.map((iconName) => {
                const isActive = form.icon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    className={cn(
                      styles.iconBtn,
                      isActive && styles.iconBtnActive,
                    )}
                    onClick={() =>
                      setForm((prev) => ({ ...prev, icon: iconName }))
                    }
                    title={iconName}
                    aria-pressed={isActive}
                  >
                    <CategoryIcon
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
              {AVAILABLE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    styles.colorCircle,
                    form.color === color && styles.colorCircleActive,
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => setForm((prev) => ({ ...prev, color }))}
                  title={color}
                  aria-label={`Cor ${color}`}
                  aria-pressed={form.color === color}
                />
              ))}
            </div>
          </div>
        </form>
      </div>

      <div className={styles.footer}>
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" form={formId} disabled={isPending}>
          {isPending
            ? 'Salvando…'
            : editing
              ? 'Salvar alterações'
              : 'Criar categoria'}
        </Button>
      </div>
    </ModalShell>
  );
}
