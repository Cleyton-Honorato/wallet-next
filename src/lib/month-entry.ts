import { isFixedEntryOverdue, isVariableEntryOverdue } from '@/lib/overdue';
import type { MonthEntryDto } from '@/lib/types';

/**
 * Leituras derivadas de um lançamento do mês. Isomórfico: o Início (servidor)
 * e a lista de Lançamentos (client) precisam concordar sobre valor e status.
 */

/** Valor que conta no mês: o efetivo quando já pago, senão o previsto. */
export function monthEntryAmount(item: MonthEntryDto): number {
  return item.source === 'fixed'
    ? item.entry.amount
    : (item.entry.actualAmount ?? item.entry.estimatedAmount);
}

/** Só despesa vence — receita atrasada é frustração, não dívida. */
export function isMonthEntryOverdue(item: MonthEntryDto, monthKey: string): boolean {
  if (item.kind !== 'expense') return false;
  return item.source === 'fixed'
    ? isFixedEntryOverdue(item.entry, monthKey)
    : isVariableEntryOverdue(item.entry, monthKey);
}

/** Mais recente primeiro — a ordem de "o que acabei de anotar". */
export function byMostRecent(a: MonthEntryDto, b: MonthEntryDto): number {
  return b.entry.createdAt.localeCompare(a.entry.createdAt);
}
