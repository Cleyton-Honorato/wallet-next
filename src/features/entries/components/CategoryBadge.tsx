import type { CategoryDto } from '@/lib/types';
import styles from './Entries.module.css';

export function CategoryBadge({ category }: { category?: CategoryDto }) {
  if (!category) {
    return <span className={styles.badge}>Sem categoria</span>;
  }

  return (
    <span className={styles.badge}>
      <span
        className={styles.badgeDot}
        style={{ backgroundColor: category.color }}
        aria-hidden
      />
      {category.name}
    </span>
  );
}
