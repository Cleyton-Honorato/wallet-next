'use client';

import { useId, useState, useTransition, type FormEvent } from 'react';
import { MoreHorizontal, X } from 'lucide-react';
import { ModalShell } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CategoryIcon } from '@/features/categories/icon-map';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDateForInput } from '@/lib/format';
import { formatMonthKeyLabel, getCurrentMonthKey, toMonthKey } from '@/lib/month';
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
  /** Mês que o usuário está olhando — define a data inicial do lançamento. */
  monthKey: string;
  onClose: () => void;
  onSaved: (message: string) => void;
}

type DayChoice = 'today' | 'yesterday' | 'other';

function toIsoDate(date: Date): string {
  return formatDateForInput(date);
}

function shiftDays(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + delta);
}

/** 'YYYY-MM-DD' → Date local (sem o deslocamento de fuso do `new Date(str)`). */
function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/**
 * Lançamento em três toques: valor, categoria, salvar — a tela "Lançar gasto
 * em 3 toques" do mockup. Ocupa a tela inteira no celular.
 *
 * Por baixo continua a matriz do domínio: sem "repete" vira um variável já
 * quitado no mês da data escolhida (avulsos guardam só o mês, não o dia); com
 * "repete" vira um fixo que vence naquele dia, já quitado naquele mês.
 */
export function QuickAddSheet({
  initialKind,
  categories,
  monthKey,
  onClose,
  onSaved,
}: QuickAddSheetProps) {
  const ids = useId();
  const today = new Date();
  const todayIso = toIsoDate(today);
  const viewingCurrentMonth = monthKey === getCurrentMonthKey();

  const [kind, setKind] = useState<EntryKind>(initialKind);
  const [amountText, setAmountText] = useState('');
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [repeat, setRepeat] = useState(false);
  const [showAll, setShowAll] = useState(false);
  // Olhando um mês passado, o lançamento nasce nele, não em hoje.
  const [dayChoice, setDayChoice] = useState<DayChoice>(
    viewingCurrentMonth ? 'today' : 'other',
  );
  const [otherDate, setOtherDate] = useState(
    viewingCurrentMonth ? todayIso : `${monthKey}-01`,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isExpense = kind === 'expense';
  const options = categories.filter(
    (c) => c.type === (isExpense ? 'EXPENSE' : 'INCOME'),
  );
  // Duas linhas de 4: com mais de 8, o 8º espaço vira "Ver todas".
  const collapsed = !showAll && options.length > VISIBLE_CATEGORIES;
  const visible = collapsed ? options.slice(0, VISIBLE_CATEGORIES - 1) : options;
  const selected = options.find((c) => c.id === categoryId) ?? null;

  const amount = parseAmount(amountText);
  const amountOk = Number.isFinite(amount) && amount > 0;

  const date =
    dayChoice === 'today'
      ? today
      : dayChoice === 'yesterday'
        ? shiftDays(today, -1)
        : parseIsoDate(otherDate);

  const switchKind = (next: EntryKind) => {
    if (next === kind) return;
    setKind(next);
    setCategoryId(null);
    setShowAll(false);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!amountOk) {
      setError('Digite quanto foi.');
      return;
    }
    if (!selected) {
      setError('Escolha uma categoria.');
      return;
    }
    if (!date || toIsoDate(date) > todayIso) {
      setError('Escolha uma data até hoje.');
      return;
    }
    setError(null);

    const entryTitle = title.trim() || selected.name;
    const value = Math.round(amount * 100) / 100;
    const entryMonth = toMonthKey(date.getFullYear(), date.getMonth() + 1);

    startTransition(async () => {
      if (!repeat) {
        const result = await createVariableEntryAction(kind, {
          categoryId: selected.id,
          title: entryTitle,
          estimatedAmount: value,
          actualAmount: value,
          month: entryMonth,
          settled: true,
        });
        if (!result.ok) return setError(result.error);
      } else {
        const created = await createFixedEntryAction(kind, {
          categoryId: selected.id,
          title: entryTitle,
          amount: value,
          day: date.getDate(),
          startDate: toIsoDate(date),
          isActive: true,
        });
        if (!created.ok) return setError(created.error);

        const settled = await settleFixedEntryAction(kind, {
          id: created.data.id,
          month: entryMonth,
          settled: true,
        });
        if (!settled.ok) return setError(settled.error);
      }

      const where =
        entryMonth === monthKey ? '' : ` em ${formatMonthKeyLabel(entryMonth).split(' ')[0]}`;
      onSaved(
        `${isExpense ? 'Gasto' : 'Entrada'} de ${formatCurrency(value)} anotado${where}`,
      );
      onClose();
    });
  };

  const dayChips: { id: DayChoice; label: string }[] = [
    { id: 'today', label: 'Hoje' },
    { id: 'yesterday', label: 'Ontem' },
    { id: 'other', label: 'Outra data' },
  ];

  return (
    <ModalShell labelledBy={`${ids}-title`} onClose={onClose} className={styles.sheet}>
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <h2 id={`${ids}-title`} className={styles.srOnly}>
          {isExpense ? 'Anotar gasto' : 'Anotar entrada'}
        </h2>

        <div className={styles.top}>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={20} strokeWidth={2.4} />
          </button>
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
          <span className={styles.topSpacer} aria-hidden />
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
            placeholder={isExpense ? 'Ex.: mercado da semana' : 'Ex.: salário'}
            onChange={(e) => setTitle(e.target.value)}
          />
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
              {collapsed && (
                <button
                  type="button"
                  className={styles.cat}
                  onClick={() => setShowAll(true)}
                  aria-label={`Ver todas as ${options.length} categorias`}
                >
                  <span className={styles.catIcon}>
                    <MoreHorizontal size={22} />
                  </span>
                  <span className={styles.catName}>Ver todas</span>
                </button>
              )}
            </div>
          )}
        </fieldset>

        <div className={styles.dateBlock}>
          <div className={styles.chips} role="group" aria-label="Quando foi">
            {dayChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                aria-pressed={dayChoice === chip.id}
                className={cn(styles.chip, dayChoice === chip.id && styles.chipOn)}
                onClick={() => setDayChoice(chip.id)}
              >
                {chip.label}
              </button>
            ))}
          </div>
          {dayChoice === 'other' && (
            <div className={styles.field}>
              <label htmlFor={`${ids}-date`} className={styles.srOnly}>
                Data
              </label>
              <input
                id={`${ids}-date`}
                type="date"
                className={styles.text}
                value={otherDate}
                max={todayIso}
                onChange={(e) => setOtherDate(e.target.value)}
              />
            </div>
          )}
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
              {isExpense ? 'Ex.: aluguel, academia, internet' : 'Ex.: salário, mesada'}
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
          <Button type="submit" size="lg" block disabled={isPending}>
            {isPending ? 'Salvando…' : isExpense ? 'Salvar gasto' : 'Salvar entrada'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
