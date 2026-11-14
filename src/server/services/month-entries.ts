import 'server-only';
import { listFixedExpenses } from '@/server/services/fixed-expenses';
import { listFixedIncomes } from '@/server/services/fixed-incomes';
import { listVariableExpenses } from '@/server/services/variable-expenses';
import { listVariableIncomes } from '@/server/services/variable-incomes';
import type { FixedEntryDto, MonthEntryDto } from '@/lib/types';

/** O recorrente existe neste mês? Datas são 'YYYY-MM-DD', comparadas como texto. */
function coversMonth(entry: FixedEntryDto, monthKey: string): boolean {
  if (!entry.isActive) return false;
  if (entry.startDate.slice(0, 7) > monthKey) return false;
  return !entry.endDate || entry.endDate.slice(0, 7) >= monthKey;
}

/**
 * Tudo o que acontece no mês, despesas e receitas, fixas e variáveis, numa
 * lista só. Compõe os services existentes: nenhuma regra nova de escopo —
 * cada um já filtra pelo `userId`.
 */
export async function listMonthEntries(
  userId: number,
  monthKey: string,
): Promise<MonthEntryDto[]> {
  const [fixedOut, fixedIn, variableOut, variableIn] = await Promise.all([
    listFixedExpenses(userId, monthKey),
    listFixedIncomes(userId, monthKey),
    listVariableExpenses(userId, monthKey),
    listVariableIncomes(userId, monthKey),
  ]);

  return [
    ...fixedOut
      .filter((e) => coversMonth(e, monthKey))
      .map((entry) => ({ key: `fe-${entry.id}`, source: 'fixed' as const, kind: 'expense' as const, entry })),
    ...fixedIn
      .filter((e) => coversMonth(e, monthKey))
      .map((entry) => ({ key: `fi-${entry.id}`, source: 'fixed' as const, kind: 'income' as const, entry })),
    ...variableOut.map((entry) => ({ key: `ve-${entry.id}`, source: 'variable' as const, kind: 'expense' as const, entry })),
    ...variableIn.map((entry) => ({ key: `vi-${entry.id}`, source: 'variable' as const, kind: 'income' as const, entry })),
  ];
}
