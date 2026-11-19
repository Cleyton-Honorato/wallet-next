'use client';

import { useState, useTransition } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { BackLink } from '@/components/ui/BackLink';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { brandTone } from '@/lib/palette';
import type { CategoryDto, CategoryType } from '@/lib/types';
import { deleteCategoryAction } from '@/server/actions/categories';
import { CategoryIcon } from '../icon-map';
import { CategoryDialog } from './CategoryDialog';
import styles from './CategoriesPage.module.css';

function CategoryCard({
  category,
  onEdit,
  onDelete,
}: {
  category: CategoryDto;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isIncome = category.type === 'INCOME';
  const tone = brandTone(category.color);

  return (
    <div className={styles.categoryCard}>
      <div className={styles.categoryCardHeader}>
        <div className={styles.categoryCardLeft}>
          <div
            className={styles.iconContainer}
            style={{ backgroundColor: tone.soft }}
          >
            <CategoryIcon name={category.icon} label={category.name} size={22} color={tone.color} />
          </div>
          <div className={styles.categoryMeta}>
            <span className={styles.categoryName}>{category.name}</span>
            <span
              className={cn(
                styles.badge,
                isIncome ? styles.badgeIncome : styles.badgeExpense,
              )}
            >
              {isIncome ? 'Entrada' : 'Gasto'}
            </span>
          </div>
        </div>

        {!category.isSystem && (
          <div className={styles.categoryActions}>
            <button
              className={styles.actionBtn}
              title="Editar"
              onClick={onEdit}
              aria-label={`Editar ${category.name}`}
            >
              <Pencil size={18} />
            </button>
            <button
              className={cn(styles.actionBtn, styles.actionBtnDanger)}
              title="Excluir"
              onClick={onDelete}
              aria-label={`Excluir ${category.name}`}
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      <div
        className={styles.categoryAccent}
        style={{ backgroundColor: tone.color }}
      />
    </div>
  );
}

export function CategoriesView({ categories }: { categories: CategoryDto[] }) {
  const [activeTab, setActiveTab] = useState<CategoryType>('EXPENSE');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const incomeCategories = categories.filter((c) => c.type === 'INCOME');
  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');
  const visible = activeTab === 'INCOME' ? incomeCategories : expenseCategories;

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (category: CategoryDto) => {
    setEditing(category);
    setDialogOpen(true);
  };

  const handleDelete = (category: CategoryDto) => {
    if (!window.confirm(`Excluir "${category.name}"?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteCategoryAction({ id: category.id });
      if (!result.ok) setError(result.error);
    });
  };

  return (
    <div className={styles.page}>
      <BackLink href="/profile" label="Perfil" />
      <div className={styles.header}>
        <div className={styles.intro}>
          <h1 className={styles.title}>Categorias</h1>
          <p className={styles.subtitle}>
            Organize seus gastos e entradas do seu jeito
          </p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={openCreate}>
          Nova categoria
        </Button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.tabs}>
        <div className={styles.tabList} role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'INCOME'}
            className={cn(
              styles.tabTrigger,
              activeTab === 'INCOME' && styles.tabTriggerActive,
            )}
            onClick={() => setActiveTab('INCOME')}
          >
            <span
              className={styles.tabDot}
              style={{ backgroundColor: 'var(--color-income)' }}
            />
            Entradas ({incomeCategories.length})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'EXPENSE'}
            className={cn(
              styles.tabTrigger,
              activeTab === 'EXPENSE' && styles.tabTriggerActive,
            )}
            onClick={() => setActiveTab('EXPENSE')}
          >
            <span
              className={styles.tabDot}
              style={{ backgroundColor: 'var(--ink)' }}
            />
            Gastos ({expenseCategories.length})
          </button>
        </div>

        {visible.length === 0 ? (
          <p className={styles.empty}>
            Nenhuma categoria de{' '}
            {activeTab === 'INCOME' ? 'entrada' : 'gasto'} cadastrada.
          </p>
        ) : (
          <div className={styles.categoryGrid}>
            {visible.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onEdit={() => openEdit(category)}
                onDelete={() => handleDelete(category)}
              />
            ))}
          </div>
        )}
      </div>

      {dialogOpen && (
        <CategoryDialog
          editing={editing}
          defaultType={activeTab}
          onClose={() => {
            setDialogOpen(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
