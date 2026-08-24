import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DASHBOARD_AVAILABLE_YEARS } from '@/lib/constants';

export interface DashboardPeriod {
  year: number;
  /** 1–12; ausente significa o ano inteiro. */
  month?: number;
}

export function formatPeriodLabel(period: DashboardPeriod): string {
  if (period.month !== undefined && period.month >= 1 && period.month <= 12) {
    return format(new Date(period.year, period.month - 1, 1), 'MMMM yyyy', {
      locale: ptBR,
    });
  }
  return `Anual ${period.year}`;
}

export function formatMonthLabel(monthKey: string): string {
  const [yearStr, monthPart] = monthKey.split('-');
  return format(new Date(Number(yearStr), Number(monthPart) - 1, 1), 'MMMM yyyy', {
    locale: ptBR,
  });
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Lê o período dos search params, caindo no ano corrente quando ausente. */
export function resolvePeriod(params: {
  year?: string;
  month?: string;
}): DashboardPeriod {
  const parsedYear = Number(params.year);
  const year =
    Number.isInteger(parsedYear) && DASHBOARD_AVAILABLE_YEARS.includes(parsedYear as never)
      ? parsedYear
      : new Date().getFullYear();

  const parsedMonth = Number(params.month);
  const month =
    Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12
      ? parsedMonth
      : undefined;

  return { year, month };
}
