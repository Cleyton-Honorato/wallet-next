/**
 * Transforma um objetivo com prazo em plano de ação: quantos meses faltam e
 * quanto guardar por mês para chegar lá. Funções puras — sem `server-only`,
 * usadas na UI e exercitadas por testes.
 */

/**
 * Meses cheios até a data-alvo, contando o mês corrente como 1.
 * Uma data já passada devolve 0 — não há mais prazo a distribuir.
 */
export function monthsRemaining(
  targetDate: string,
  now: Date = new Date(),
): number {
  const [year, month] = targetDate.split('-').map(Number);
  if (!year || !month) return 0;

  const diff =
    (year - now.getFullYear()) * 12 + (month - 1 - now.getMonth());

  // O próprio mês da meta ainda conta como um mês para guardar.
  return diff < 0 ? 0 : diff + 1;
}

/** Quanto guardar por mês para cobrir o que falta no prazo restante. */
export function suggestedMonthly(remaining: number, months: number): number {
  if (remaining <= 0 || months <= 0) return 0;
  return Math.ceil(remaining / months);
}
