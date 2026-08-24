import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import styles from './MiniStatCard.module.css';

export type MiniStatVariant = 'income' | 'expense' | 'investment';

interface MiniStatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  variant: MiniStatVariant;
}

/** Indicador compacto com ícone tingido, na linha de leitura rápida. */
export function MiniStatCard({
  title,
  value,
  subtitle,
  icon,
  variant,
}: MiniStatCardProps) {
  return (
    <div className={cn(styles.card, styles[variant])}>
      <span className={styles.icon}>{icon}</span>
      <div className={styles.body}>
        <span className={styles.title}>{title}</span>
        <span className={styles.value}>{value}</span>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </div>
    </div>
  );
}
