import type { ReactNode } from 'react';
import styles from './PageContainer.module.css';

/** Padding, largura máxima e animação de entrada consistentes entre páginas. */
export function PageContainer({ children }: { children: ReactNode }) {
  return <main className={styles.container}>{children}</main>;
}
