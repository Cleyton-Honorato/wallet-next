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

/**
 * `month` na URL tem três estados: ausente (padrão), `0` e `1..12`.
 * Sem o parâmetro o dashboard abre no **mês corrente** — o recorte que
 * interessa no dia a dia. `month=0` é a escolha explícita de "Anual", e por
 * isso a toolbar precisa escrevê-lo na URL em vez de omitir o parâmetro.
 */
function resolveMonth(raw: string | undefined): number | undefined {
  const currentMonth = new Date().getMonth() + 1;
  if (raw === undefined || raw === '') return currentMonth;

  const parsed = Number(raw);
  if (parsed === 0) return undefined; // anual
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 12
    ? parsed
    : currentMonth;
}

/** Lê o período dos search params, caindo no mês corrente quando ausente. */
export function resolvePeriod(params: {
  year?: string;
  month?: string;
}): DashboardPeriod {
  const parsedYear = Number(params.year);
  const year =
    Number.isInteger(parsedYear) && DASHBOARD_AVAILABLE_YEARS.includes(parsedYear as never)
      ? parsedYear
      : new Date().getFullYear();

  return { year, month: resolveMonth(params.month) };
}
