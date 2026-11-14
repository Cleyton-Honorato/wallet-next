'use client';

import { useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMonthKeyLabel, getCurrentMonthKey, shiftMonthKey } from '@/lib/month';
import { capitalize } from '@/lib/period-label';
import styles from './MonthPill.module.css';

/**
 * Troca de mês em uma pílula só. O mês vive na URL (`?month=YYYY-MM`) e os
 * demais parâmetros (ex.: filtro) são preservados. Não avança além do mês
 * corrente, a não ser com `allowFuture` (orçamento).
 */
export function MonthPill({
  monthKey,
  allowFuture = false,
}: {
  monthKey: string;
  allowFuture?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const goTo = (next: string) => {
    const query = new URLSearchParams(params.toString());
    query.set('month', next);
    startTransition(() => {
      router.replace(`${pathname}?${query.toString()}`, { scroll: false });
    });
  };

  const atLimit = !allowFuture && monthKey >= getCurrentMonthKey();
  const [, year] = formatMonthKeyLabel(monthKey).split(' ');
  const monthName = capitalize(formatMonthKeyLabel(monthKey).split(' ')[0]);
  const showYear = year !== String(new Date().getFullYear());

  return (
    <div className={styles.pill} aria-busy={isPending}>
      <button
        type="button"
        className={styles.arrow}
        onClick={() => goTo(shiftMonthKey(monthKey, -1))}
        aria-label="Mês anterior"
      >
        <ChevronLeft size={20} />
      </button>
      <span className={styles.label} aria-live="polite">
        {monthName}
        {showYear && ` ${year}`}
      </span>
      <button
        type="button"
        className={styles.arrow}
        onClick={() => goTo(shiftMonthKey(monthKey, 1))}
        aria-label="Próximo mês"
        disabled={atLimit}
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
