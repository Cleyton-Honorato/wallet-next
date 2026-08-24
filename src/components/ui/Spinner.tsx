import { cn } from '@/lib/cn';
import styles from './Feedback.module.css';

/** Indicador de carregamento das rotas (`loading.tsx`). */
export function Spinner({ fullscreen = false }: { fullscreen?: boolean }) {
  return (
    <div
      className={cn(styles.center, fullscreen && styles.fullscreen)}
      role="status"
      aria-label="Carregando"
    >
      <span className={styles.spinner} />
    </div>
  );
}
