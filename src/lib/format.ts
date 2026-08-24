import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DATE_FORMATS,
  DEFAULT_CURRENCY,
  DEFAULT_LOCALE,
} from '@/lib/constants';

/**
 * Formata um número como moeda.
 *
 * @example formatCurrency(1234.56) // "R$ 1.234,56"
 */
export function formatCurrency(
  value: number,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Formata um número como moeda compacta (ex.: R$ 1,2 mil). */
export function formatCurrencyCompact(
  value: number,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Formata uma data (string ISO / 'YYYY-MM-DD' ou Date).
 *
 * @example formatDate('2024-03-15') // "15/03/2024"
 */
export function formatDate(
  date: string | Date,
  pattern: string = DATE_FORMATS.DISPLAY,
): string {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '—';
  return format(parsed, pattern, { locale: ptBR });
}

/** Formata uma data como tempo relativo (ex.: "há 2 dias"). */
export function formatRelativeDate(date: string | Date): string {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '—';
  return formatDistanceToNow(parsed, { addSuffix: true, locale: ptBR });
}

/** Formata uma data no formato aceito pelos inputs/schemas (yyyy-MM-dd). */
export function formatDateForInput(date: Date): string {
  return format(date, DATE_FORMATS.API);
}

export function formatDueDay(day: number): string {
  return `Dia ${day}`;
}

export function formatPeriodRange(startDate: string, endDate?: string | null): string {
  const start = formatDate(startDate);
  if (!endDate) return `${start} · sem término`;
  return `${start} → ${formatDate(endDate)}`;
}

export function parseTagsInput(value: string): string[] {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function formatTags(tags?: string[]): string {
  return tags?.join(', ') ?? '';
}
