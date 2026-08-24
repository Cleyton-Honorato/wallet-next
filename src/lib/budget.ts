export type BudgetStatus = 'ok' | 'warning' | 'over';

const WARNING_THRESHOLD = 80;
const OVER_THRESHOLD = 100;

export function getBudgetUsagePercent(spent: number, planned: number): number {
  if (planned <= 0) return spent > 0 ? 100 : 0;
  return Math.round((spent / planned) * 100);
}

export function getRemaining(planned: number, spent: number): number {
  return Math.max(0, planned - spent);
}

export function getBudgetStatus(usagePercent: number): BudgetStatus {
  if (usagePercent >= OVER_THRESHOLD) return 'over';
  if (usagePercent >= WARNING_THRESHOLD) return 'warning';
  return 'ok';
}
