import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import styles from './Panel.module.css';

interface PanelProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Superfície com linha de título e ação opcional à direita. */
export function Panel({ title, action, children, className }: PanelProps) {
  return (
    <section className={cn(styles.panel, className)} aria-label={title}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {action}
      </div>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
