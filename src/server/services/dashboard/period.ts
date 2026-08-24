/**
 * Utilitários de período do dashboard.
 *
 * Este arquivo é a fusão de `dashboard.period.ts` (API) com
 * `periodUtils.ts` (frontend), que eram cópias uma da outra — a duplicação
 * que motivou a unificação dos projetos.
 *
 * `month` é 1–12; quando ausente, o período é o ano inteiro.
 * Sem `server-only`: são funções puras, úteis também nos testes.
 */

export interface PeriodBounds {
  start: Date;
  end: Date;
}

export function getPeriodBounds(year: number, month?: number): PeriodBounds {
  if (month !== undefined && month >= 1 && month <= 12) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999); // último dia do mês
    return { start, end };
  }
  return {
    start: new Date(year, 0, 1),
    end: new Date(year, 11, 31, 23, 59, 59, 999),
  };
}

/**
 * Conta os meses em que um item fixo está ativo dentro do período.
 * É o que projeta um valor mensal sobre a visão anual: um aluguel de R$ 2.200
 * ativo o ano todo soma R$ 26.400.
 */
export function countActiveMonthsInPeriod(
  itemStart: Date,
  itemEnd: Date | null,
  bounds: PeriodBounds,
  month?: number,
): number {
  const end = itemEnd ?? bounds.end;
  const effectiveStart = itemStart > bounds.start ? itemStart : bounds.start;
  const effectiveEnd = end < bounds.end ? end : bounds.end;
  if (effectiveStart > effectiveEnd) return 0;
  if (month !== undefined && month >= 1) return 1;

  let count = 0;
  const cursor = new Date(
    effectiveStart.getFullYear(),
    effectiveStart.getMonth(),
    1,
  );
  const last = new Date(effectiveEnd.getFullYear(), effectiveEnd.getMonth(), 1);
  while (cursor <= last) {
    count += 1;
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return count;
}

/** Filtro Prisma para o campo `month` (YYYY-MM) dentro do período. */
export function monthFilter(year: number, month?: number) {
  if (month !== undefined && month >= 1 && month <= 12) {
    return `${year}-${String(month).padStart(2, '0')}`;
  }
  return { startsWith: `${year}-` };
}

/** Mês de orçamento alvo: o do período, ou o mês corrente na visão anual. */
export function getBudgetMonthKey(year: number, month?: number): string {
  if (month !== undefined && month >= 1 && month <= 12) {
    return `${year}-${String(month).padStart(2, '0')}`;
  }
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
