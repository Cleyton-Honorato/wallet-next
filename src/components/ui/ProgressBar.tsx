import { getBudgetStatus } from '@/lib/budget';
import { cn } from '@/lib/cn';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  value: number;
  max: number;
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max,
  showLabel = false,
  className,
}: ProgressBarProps) {
  const percent =
    max > 0 ? Math.min(100, Math.round((value / max) * 100)) : value > 0 ? 100 : 0;
  const status = getBudgetStatus(percent);

  return (
    <div className={cn(styles.wrapper, className)}>
      <div
        className={styles.track}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn(styles.fill, styles[status])}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && <span className={styles.label}>{percent}%</span>}
    </div>
  );
}
