'use client';

import { useId, useState, useTransition, type FormEvent } from 'react';
import { Check } from 'lucide-react';
import { ModalShell } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CategoryIcon } from '@/features/categories/icon-map';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDateForInput } from '@/lib/format';
import { getCurrentMonthKey } from '@/lib/month';
import { clampDueDay } from '@/lib/overdue';
import type { CategoryDto, EntryKind } from '@/lib/types';
import {
  createFixedEntryAction,
  createVariableEntryAction,
  settleFixedEntryAction,
} from '@/server/actions/entries';
import styles from './QuickAdd.module.css';

const VISIBLE_CATEGORIES = 8;

/** "1.234,56", "84,5" ou "84.50" → número; NaN quando não dá para ler. */
export function parseAmount(raw: string): number {
  const cleaned = raw.replace(/[^\d.,]/g, '');
  if (!cleaned) return Number.NaN;
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned;
  return Number(normalized);
}

interface QuickAddSheetProps {
  initialKind: EntryKind;
  categories: CategoryDto[];
  /** Mês em que o lançamento cai — o que o usuário está olhando. */
  monthKey: string;
  onClose: () => void;
  onSaved: (message: string) => void;
}

/**
 * Lançamento em três toques: valor, categoria, salvar.
 *
 * Por baixo continua a matriz do domínio: sem "repete" vira um variável já
 * quitado no mês; com "repete" vira um fixo, quitado no mês corrente — afinal
 * o usuário está dizendo que acabou de gastar/receber.
 */
export function QuickAddSheet({
  initialKind,
  categories,
  monthKey,
  onClose,
  onSaved,
}: QuickAddSheetProps) {
  const ids = useId();
  const [kind, setKind] = useState<EntryKind>(initialKind);
  const [amountText, setAmountText] = useState('');
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [repeat, setRepeat] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isExpense = kind === 'expense';
  const options = categories.filter(
    (c) => c.type === (isExpense ? 'EXPENSE' : 'INCOME'),
  );
  const visible = showAll ? options : options.slice(0, VISIBLE_CATEGORIES);
  const selected = options.find((c) => c.id === categoryId) ?? null;

  const amount = parseAmount(amountText);
  const amountOk = Number.isFinite(amount) && amount > 0;
  const canSave = amountOk && selected !== null && !isPending;

  const switchKind = (next: EntryKind) => {
    if (next === kind) return;
    setKind(next);
    setCategoryId(null);
    setShowAll(false);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!selected) {
      setError('Escolha uma categoria.');
      return;
    }
    if (!amountOk) {
      setError('Digite um valor maior que zero.');
      return;
    }
    setError(null);

    const entryTitle = title.trim() || selected.name;
    const value = Math.round(amount * 100) / 100;

    startTransition(async () => {
      if (!repeat) {
        const result = await createVariableEntryAction(kind, {
          categoryId: selected.id,
          title: entryTitle,
          estimatedAmount: value,
          actualAmount: value,
          month: monthKey,
          settled: true,
        });
        if (!result.ok) return setError(result.error);
      } else {
        const today = new Date();
        const isCurrent = monthKey === getCurrentMonthKey();
        const [y, m] = monthKey.split('-').map(Number);
        const created = await createFixedEntryAction(kind, {
          categoryId: selected.id,
          title: entryTitle,
          amount: value,
          day: clampDueDay(y, m - 1, today.getDate()),
          startDate: isCurrent ? formatDateForInput(today) : `${monthKey}-01`,
          isActive: true,
        });
        if (!created.ok) return setError(created.error);

        const settled = await settleFixedEntryAction(kind, {
          id: created.data.id,
          month: monthKey,
          settled: true,
        });
        if (!settled.ok) return setError(settled.error);
      }

      onSaved(
        `${isExpense ? 'Gasto' : 'Entrada'} de ${formatCurrency(value)} anotado`,
      );
      onClose();
    });
  };

  return (
    <ModalShell labelledBy={`${ids}-title`} onClose={onClose}>
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <h2 id={`${ids}-title`} className={styles.srOnly}>
          {isExpense ? 'Anotar gasto' : 'Anotar entrada'}
        </h2>

        <div className={styles.kindToggle} role="group" aria-label="Tipo de lançamento">
          <button
            type="button"
            aria-pressed={isExpense}
            className={cn(styles.kindBtn, isExpense && styles.kindBtnOn)}
            onClick={() => switchKind('expense')}
          >
            Gastei
          </button>
          <button
            type="button"
            aria-pressed={!isExpense}
            className={cn(styles.kindBtn, !isExpense && styles.kindBtnOn)}
            onClick={() => switchKind('income')}
          >
            Recebi
          </button>
        </div>

        <div className={styles.amountBlock}>
          <label htmlFor={`${ids}-amount`} className={styles.amountLabel}>
            {isExpense ? 'Quanto você gastou?' : 'Quanto você recebeu?'}
          </label>
          <div className={styles.amountRow}>
            <span className={styles.currency}>R$</span>
            <input
              id={`${ids}-amount`}
              className={styles.amountInput}
              inputMode="decimal"
              autoComplete="off"
              placeholder="0,00"
              value={amountText}
              onChange={(e) => setAmountText(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <fieldset className={styles.fieldset}>
          <legend className={styles.label}>Categoria</legend>
          {options.length === 0 ? (
            <p className={styles.hint}>
              Você ainda não tem categorias de {isExpense ? 'gasto' : 'entrada'}.
              Crie uma em Perfil → Categorias.
            </p>
          ) : (
            <div className={styles.catGrid}>
              {visible.map((c) => {
                const on = c.id === categoryId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={on}
                    className={cn(styles.cat, on && styles.catOn)}
                    onClick={() => setCategoryId(c.id)}
                  >
                    <span className={styles.catIcon}>
                      <CategoryIcon name={c.icon} label={c.name} size={22} />
                    </span>
                    <span className={styles.catName}>{c.name}</span>
                  </button>
                );
              })}
              {options.length > VISIBLE_CATEGORIES && !showAll && (
                <button
                  type="button"
                  className={styles.cat}
                  onClick={() => setShowAll(true)}
                >
                  <span className={styles.catIcon}>+{options.length - VISIBLE_CATEGORIES}</span>
                  <span className={styles.catName}>Ver todas</span>
                </button>
              )}
            </div>
          )}
        </fieldset>

        <div className={styles.field}>
          <label htmlFor={`${ids}-title-input`} className={styles.label}>
            {isExpense ? 'Com o quê?' : 'De onde veio?'}{' '}
            <span className={styles.optional}>(opcional)</span>
          </label>
          <input
            id={`${ids}-title-input`}
            className={styles.text}
            value={title}
            maxLength={120}
            placeholder={selected?.name ?? (isExpense ? 'Ex.: mercado da semana' : 'Ex.: salário')}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={repeat}
          className={styles.switchRow}
          onClick={() => setRepeat((v) => !v)}
        >
          <span className={styles.switchText}>
            <span className={styles.switchTitle}>Repete todo mês</span>
            <span className={styles.switchHint}>
              {isExpense ? 'Aluguel, academia, internet…' : 'Salário, mesada, aluguel recebido…'}
            </span>
          </span>
          <span className={cn(styles.switch, repeat && styles.switchOn)} aria-hidden>
            <span className={styles.knob} />
          </span>
        </button>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.footer}>
          <Button variant="ghost" size="lg" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            size="lg"
            className={styles.save}
            disabled={!canSave}
            icon={isPending ? undefined : <Check size={20} />}
          >
            {isPending
              ? 'Salvando…'
              : !selected
                ? 'Escolha a categoria'
                : isExpense
                  ? 'Salvar gasto'
                  : 'Salvar entrada'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
