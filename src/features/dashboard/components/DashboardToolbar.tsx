'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import {
  DASHBOARD_AVAILABLE_YEARS,
  DASHBOARD_MONTH_OPTIONS,
} from '@/lib/constants';
import type { DashboardPeriod } from '@/lib/period-label';
import styles from './DashboardToolbar.module.css';
import filterStyles from './DashboardPeriodFilter.module.css';

interface DashboardToolbarProps {
  subtitle: string;
  period: DashboardPeriod;
  onNewTransaction: () => void;
}

export function DashboardToolbar({
  subtitle,
  period,
  onNewTransaction,
}: DashboardToolbarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // O período vive na URL — a página é um Server Component e recarrega sozinha.
  const navigate = (year: number, month?: number) => {
    const params = new URLSearchParams({ year: String(year) });
    if (month) params.set('month', String(month));
    startTransition(() => {
      router.replace(`/?${params.toString()}`, { scroll: false });
    });
  };

  const yearOptions = DASHBOARD_AVAILABLE_YEARS.map((y) => ({
    value: String(y),
    label: String(y),
  }));
  const monthOptions = DASHBOARD_MONTH_OPTIONS.map((m) => ({
    value: String(m.value),
    label: m.label,
  }));

  return (
    <div className={styles.toolbar} aria-busy={isPending}>
      <div className={styles.intro}>
        <h1 className={styles.title}>Visão geral</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
      <div className={styles.controls}>
        <div className={filterStyles.filter}>
          <Select
            id="dashboard-year"
            label="Ano"
            options={yearOptions}
            value={String(period.year)}
            onChange={(e) => navigate(Number(e.target.value), period.month)}
          />
          <Select
            id="dashboard-month"
            label="Período"
            options={monthOptions}
            value={String(period.month ?? 0)}
            onChange={(e) => {
              const month = Number(e.target.value);
              navigate(period.year, month === 0 ? undefined : month);
            }}
          />
        </div>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={onNewTransaction}
        >
          Nova transação
        </Button>
      </div>
    </div>
  );
}
