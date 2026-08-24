'use client';

import { Shield } from 'lucide-react';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';
import styles from './BalanceHeroCard.module.css';

interface BalanceHeroCardProps {
  balance: number;
  periodLabel: string;
  emergencyFund: { balance: number; targetAmount: number };
  onManageReserve: () => void;
}

/** Destaque: saldo do período mais o progresso da reserva de emergência. */
export function BalanceHeroCard({
  balance,
  periodLabel,
  emergencyFund,
  onManageReserve,
}: BalanceHeroCardProps) {
  const { balance: reserveBalance, targetAmount } = emergencyFund;

  return (
    <section className={styles.hero} aria-label="Saldo do período">
      <div className={styles.top}>
        <span className={styles.label}>Saldo do mês</span>
        <span className={styles.tag}>{periodLabel}</span>
      </div>

      <div className={cn(styles.value, balance < 0 && styles.negative)}>
        {formatCurrency(balance)}
      </div>

      <div className={styles.divider} />

      <button
        type="button"
        className={styles.reserve}
        onClick={onManageReserve}
        aria-label="Gerenciar reserva de emergência"
      >
        <div className={styles.reserveHead}>
          <span className={styles.reserveLabel}>
            <span className={styles.reserveIcon}>
              <Shield size={16} />
            </span>
            Reserva de emergência
          </span>
          <span className={styles.reserveValue}>
            {formatCurrency(reserveBalance)}
          </span>
        </div>
        <ProgressBar value={reserveBalance} max={targetAmount} />
        <div className={styles.reserveFoot}>
          <span>Meta</span>
          <span className={styles.reserveGoal}>
            {formatCurrency(targetAmount)}
          </span>
        </div>
      </button>
    </section>
  );
}
