'use client';

import { useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  formatMonthKeyLabel,
  getCurrentMonthKey,
  shiftMonthKey,
} from '@/lib/month';
import styles from './Entries.module.css';

/**
 * O mês vive na URL (`?month=YYYY-MM`): o link é compartilhável e o Server
 * Component refaz a leitura sozinho ao navegar.
 *
 * Lançamentos param no mês corrente (não se registra gasto do futuro); com
 * `allowFuture`, a navegação segue adiante — é o caso do orçamento, que existe
 * justamente para planejar meses que ainda não chegaram.
 */
export function MonthNavigator({
  monthKey,
  allowFuture = false,
}: {
  monthKey: string;
  allowFuture?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const goTo = (next: string) => {
    startTransition(() => {
      router.replace(`${pathname}?month=${next}`, { scroll: false });
    });
  };

  const atLastAllowedMonth = !allowFuture && monthKey === getCurrentMonthKey();

  return (
    <div className={styles.monthNav} aria-busy={isPending}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => goTo(shiftMonthKey(monthKey, -1))}
        aria-label="Mês anterior"
      >
        <ChevronLeft size={18} />
      </Button>
      <span className={styles.monthLabel}>{formatMonthKeyLabel(monthKey)}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => goTo(shiftMonthKey(monthKey, 1))}
        aria-label="Próximo mês"
        disabled={atLastAllowedMonth}
      >
        <ChevronRight size={18} />
      </Button>
    </div>
  );
}
