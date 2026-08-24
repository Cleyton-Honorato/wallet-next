import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * O período contábil do domínio é a string `YYYY-MM` (coluna Char(7)),
 * nunca um Date — comparações e filtros são sempre textuais.
 */

export const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isValidMonthKey(value: string): boolean {
  return MONTH_KEY_PATTERN.test(value);
}

export function toMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  return toMonthKey(now.getFullYear(), now.getMonth() + 1);
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const date = new Date(Number(yearStr), Number(monthStr) - 1 + delta, 1);
  return toMonthKey(date.getFullYear(), date.getMonth() + 1);
}

export function formatMonthKeyLabel(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const date = new Date(Number(yearStr), Number(monthStr) - 1, 1);
  return format(date, 'MMMM yyyy', { locale: ptBR });
}

/** Normaliza um `?month=` vindo da URL, caindo no mês corrente quando inválido. */
export function resolveMonthKey(value: string | undefined): string {
  return value && isValidMonthKey(value) ? value : getCurrentMonthKey();
}
