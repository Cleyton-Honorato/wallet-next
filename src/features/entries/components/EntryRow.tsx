import type { ReactNode } from 'react';
import { CategoryIcon } from '@/features/categories/icon-map';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';
import { monthEntryAmount } from '@/lib/month-entry';
import type { CategoryDto, MonthEntryDto } from '@/lib/types';
import styles from './EntryRow.module.css';

interface EntryRowProps {
  item: MonthEntryDto;
  category?: CategoryDto;
  /** Linha de apoio sob o título (categoria, vencimento…). */
  meta: string;
  /** Destaque de atenção (vencida) na linha de apoio. */
  alert?: boolean;
  /** Quando presente, a linha inteira vira um botão (abre a edição). */
  onOpen?: () => void;
  /** Ação à direita, fora do botão principal (ex.: marcar como paga). */
  trailing?: ReactNode;
  muted?: boolean;
}

/** Uma linha de lançamento: ícone da categoria, título, apoio e valor. */
export function EntryRow({
  item,
  category,
  meta,
  alert = false,
  onOpen,
  trailing,
  muted = false,
}: EntryRowProps) {
  const isIncome = item.kind === 'income';
  const amount = monthEntryAmount(item);
  const color = category?.color ?? '#5e645e';

  const body = (
    <>
      <span
        className={styles.icon}
        style={{ color, backgroundColor: `${color}1f` }}
        aria-hidden
      >
        <CategoryIcon name={category?.icon} label={category?.name} size={20} />
      </span>
      <span className={styles.text}>
        <span className={styles.title}>{item.entry.title}</span>
        <span className={cn(styles.meta, alert && styles.metaAlert)}>{meta}</span>
      </span>
      <span className={cn(styles.amount, isIncome && styles.amountIn)}>
        {isIncome ? '+ ' : '− '}
        {formatCurrency(amount)}
      </span>
    </>
  );

  return (
    <li className={cn(styles.row, muted && styles.muted)}>
      {onOpen ? (
        <button type="button" className={styles.main} onClick={onOpen}>
          {body}
        </button>
      ) : (
        <div className={styles.main}>{body}</div>
      )}
      {trailing}
    </li>
  );
}
