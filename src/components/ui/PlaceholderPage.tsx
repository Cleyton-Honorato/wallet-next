import type { LucideIcon } from 'lucide-react';
import styles from './PlaceholderPage.module.css';

/** Tela ainda não implementada — presente na navegação para não dar 404. */
export function PlaceholderPage({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <div className={styles.placeholder}>
      <Icon size={48} className={styles.icon} />
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.subtitle}>{subtitle}</p>
    </div>
  );
}
