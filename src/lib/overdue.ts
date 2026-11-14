/**
 * Vencimento — a definição única de "esta conta está atrasada".
 *
 * Mora em `lib` (e não no cálculo do dashboard) porque as três telas que
 * dependem disso são diferentes: a matriz anual pinta a célula, o painel de
 * contas vencidas monta a lista e as listas de despesa marcam o chip. Todas
 * precisam concordar, então a regra fica em um lugar só, puro e sem Prisma.
 *
 * `now` é sempre injetável para os testes não dependerem do relógio.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Dia de vencimento efetivo: dia 31 em fevereiro vence no dia 28/29. */
export function clampDueDay(
  year: number,
  monthIndex: number,
  dueDay: number,
): number {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(Math.max(dueDay, 1), lastDay);
}

/**
 * Vencimento de uma despesa fixa já passou? O dia do vencimento ainda está
 * em dia — só vence quando ele termina.
 */
export function isPastDue(
  year: number,
  monthIndex: number,
  dueDay: number,
  now: Date = new Date(),
): boolean {
  const day = clampDueDay(year, monthIndex, dueDay);
  return new Date(year, monthIndex, day, 23, 59, 59, 999) < now;
}

/** Fim do mês já passou? É o vencimento das despesas variáveis. */
export function isMonthPast(
  year: number,
  monthIndex: number,
  now: Date = new Date(),
): boolean {
  return new Date(year, monthIndex + 1, 0, 23, 59, 59, 999) < now;
}

/**
 * Dias completos de atraso, contados entre datas de calendário — no dia do
 * vencimento é zero. `Math.round` porque um eventual horário de verão faria a
 * diferença em milissegundos cair para 23h ou subir para 25h.
 */
function daysSince(dueDate: Date, now: Date): number {
  const diff = (startOfDay(now).getTime() - dueDate.getTime()) / DAY_MS;
  return Math.max(0, Math.round(diff));
}

/** Atraso de uma despesa fixa em relação ao seu dia de vencimento. */
export function daysLate(
  year: number,
  monthIndex: number,
  dueDay: number,
  now: Date = new Date(),
): number {
  const day = clampDueDay(year, monthIndex, dueDay);
  return daysSince(new Date(year, monthIndex, day), now);
}

/** Atraso de uma despesa variável, cujo vencimento é o último dia do mês. */
export function daysLateMonthEnd(
  year: number,
  monthIndex: number,
  now: Date = new Date(),
): number {
  return daysSince(new Date(year, monthIndex + 1, 0), now);
}

/** Dias que faltam até o vencimento — zero quando vence hoje ou já venceu. */
export function daysUntilDue(
  year: number,
  monthIndex: number,
  dueDay: number,
  now: Date = new Date(),
): number {
  const day = clampDueDay(year, monthIndex, dueDay);
  const diff =
    (new Date(year, monthIndex, day).getTime() - startOfDay(now).getTime()) /
    DAY_MS;
  return Math.max(0, Math.round(diff));
}

// ------------------------------------------------------ chave de mês

/** Quebra 'YYYY-MM' em ano e índice de mês (0–11); null se não for um mês. */
export function parseMonthKey(
  monthKey: string,
): { year: number; monthIndex: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey);
  if (!match) return null;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  return monthIndex >= 0 && monthIndex <= 11 ? { year, monthIndex } : null;
}

export function toMonthKey(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
}

/**
 * Mês de uma data pura (`@db.Date`), que o Prisma devolve como meia-noite UTC.
 *
 * Ler os componentes em UTC é o que impede o erro de um mês: no fuso de São
 * Paulo, meia-noite UTC do dia 1º é 21h do último dia do mês anterior, e uma
 * despesa que começa em julho passaria a existir em junho. É também exatamente
 * como `toDateOnly` serializa a data para a tela, então cálculo e exibição
 * enxergam o mesmo mês.
 */
export function monthKeyOfDate(date: Date): string {
  return date.toISOString().slice(0, 7);
}

/**
 * A vigência [início, fim] cobre este mês? Comparação lexicográfica sobre
 * 'YYYY-MM' — é a regra única de "este item existe neste mês", usada tanto
 * pelos DTOs (datas em texto) quanto pelas linhas do banco.
 */
export function coversMonth(
  startMonth: string,
  endMonth: string | null,
  monthKey: string,
): boolean {
  if (startMonth > monthKey) return false;
  return !(endMonth && endMonth < monthKey);
}

// ------------------------------------------- lançamentos das listas

/**
 * Despesa fixa vencida no mês exibido. Só conta o que é de fato cobrança do
 * mês: inativa ou fora da vigência não vence, e quitada não deve nada.
 */
export function isFixedEntryOverdue(
  entry: {
    settled: boolean;
    isActive: boolean;
    day: number;
    startDate: string;
    endDate: string | null;
  },
  monthKey: string,
  now: Date = new Date(),
): boolean {
  if (entry.settled || !entry.isActive) return false;
  const endMonth = entry.endDate ? entry.endDate.slice(0, 7) : null;
  if (!coversMonth(entry.startDate.slice(0, 7), endMonth, monthKey)) {
    return false;
  }

  const period = parseMonthKey(monthKey);
  if (!period) return false;
  return isPastDue(period.year, period.monthIndex, entry.day, now);
}

// ------------------------------------------------ recortes do painel

/**
 * Gravidade do atraso. O painel usa isso para a barra de faixas; a cor de cada
 * faixa mora no CSS, aqui fica só a régua.
 */
export type OverdueAgeTone = 'critical' | 'high' | 'moderate';

export interface OverdueAgeBucket {
  tone: OverdueAgeTone;
  label: string;
  count: number;
  total: number;
}

/** Do mais grave para o menos: cada faixa vale de `min` dias para cima. */
const AGE_BUCKETS: { tone: OverdueAgeTone; label: string; min: number }[] = [
  { tone: 'critical', label: 'Mais de 180 dias', min: 181 },
  { tone: 'high', label: '90 a 180 dias', min: 90 },
  { tone: 'moderate', label: 'Até 90 dias', min: 0 },
];

/**
 * Distribui as cobranças por faixa de atraso. Faixas vazias saem do resultado
 * — a barra não deve reservar espaço para um problema que não existe.
 */
export function summarizeByAge<T extends { daysLate: number; amount: number }>(
  items: readonly T[],
): OverdueAgeBucket[] {
  return AGE_BUCKETS.map((bucket, index) => {
    const previous = AGE_BUCKETS[index - 1];
    const matching = items.filter(
      (item) =>
        item.daysLate >= bucket.min &&
        (!previous || item.daysLate < previous.min),
    );
    return {
      tone: bucket.tone,
      label: bucket.label,
      count: matching.length,
      total: matching.reduce((sum, item) => sum + item.amount, 0),
    };
  }).filter((bucket) => bucket.count > 0);
}

export interface OverdueMonthGroup<T> {
  month: string;
  total: number;
  items: T[];
}

/** Agrupa por mês de cobrança, do mais antigo para o mais recente. */
export function groupByMonth<T extends { month: string; amount: number }>(
  items: readonly T[],
): OverdueMonthGroup<T>[] {
  const groups = new Map<string, OverdueMonthGroup<T>>();

  for (const item of items) {
    const group = groups.get(item.month) ?? {
      month: item.month,
      total: 0,
      items: [],
    };
    group.total += item.amount;
    group.items.push(item);
    groups.set(item.month, group);
  }

  return [...groups.values()].sort((a, b) => a.month.localeCompare(b.month));
}

/** Despesa variável vencida: não paga e o mês dela já terminou. */
export function isVariableEntryOverdue(
  entry: { settled: boolean },
  monthKey: string,
  now: Date = new Date(),
): boolean {
  if (entry.settled) return false;

  const period = parseMonthKey(monthKey);
  if (!period) return false;
  return isMonthPast(period.year, period.monthIndex, now);
}
