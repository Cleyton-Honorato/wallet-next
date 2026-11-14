'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/cn';
import { getCurrentMonthKey, toMonthKey } from '@/lib/month';
import styles from './MonthPickerSheet.module.css';

const MONTHS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];
const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/** Limite de volta no tempo — antes disso não há o que registrar. */
const MIN_YEAR = 2000;

interface MonthPickerSheetProps {
  /** Mês selecionado agora, 'YYYY-MM'. */
  monthKey: string;
  allowFuture: boolean;
  onPick: (monthKey: string) => void;
  onClose: () => void;
}

/**
 * Escolha de mês e ano: o ano com setas e os 12 meses em grade. No celular
 * sobe como gaveta (o Modal cuida disso); no computador, janela central.
 */
export function MonthPickerSheet({
  monthKey,
  allowFuture,
  onPick,
  onClose,
}: MonthPickerSheetProps) {
  const [selectedYear, selectedMonth] = monthKey.split('-').map(Number);
  const current = getCurrentMonthKey();
  const currentYear = Number(current.slice(0, 4));

  // Abre no ano do mês escolhido; navegar de ano não troca a seleção ainda.
  const [year, setYear] = useState(selectedYear);

  const canGoBack = year > MIN_YEAR;
  const canGoForward = allowFuture || year < currentYear;

  return (
    <Modal title="Escolher mês" onClose={onClose}>
      <div className={styles.yearRow}>
        <button
          type="button"
          className={styles.yearArrow}
          onClick={() => setYear((y) => y - 1)}
          disabled={!canGoBack}
          aria-label="Ano anterior"
        >
          <ChevronLeft size={22} />
        </button>
        <span className={styles.year} aria-live="polite">
          {year}
        </span>
        <button
          type="button"
          className={styles.yearArrow}
          onClick={() => setYear((y) => y + 1)}
          disabled={!canGoForward}
          aria-label="Próximo ano"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      <div className={styles.grid} role="group" aria-label={`Meses de ${year}`}>
        {MONTHS.map((label, index) => {
          const key = toMonthKey(year, index + 1);
          const selected = year === selectedYear && index + 1 === selectedMonth;
          const isCurrent = key === current;
          const future = !allowFuture && key > current;
          return (
            <button
              key={key}
              type="button"
              className={cn(
                styles.month,
                selected && styles.monthSelected,
                isCurrent && styles.monthCurrent,
              )}
              aria-pressed={selected}
              aria-label={`${MONTH_NAMES[index]} de ${year}${isCurrent ? ', mês atual' : ''}`}
              disabled={future}
              onClick={() => onPick(key)}
            >
              {label}
            </button>
          );
        })}
      </div>

      {monthKey !== current && (
        <button type="button" className={styles.today} onClick={() => onPick(current)}>
          Voltar para o mês atual
        </button>
      )}
    </Modal>
  );
}
