import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/PageContainer';
import { BudgetsView } from '@/features/budgets/components/BudgetsView';
import { resolveMonthKey, shiftMonthKey } from '@/lib/month';
import { requireUser } from '@/server/auth/session';
import { getBudgetForMonth } from '@/server/services/budgets';
import { listCategories } from '@/server/services/categories';

export const metadata: Metadata = { title: 'Orçamentos — Wallet' };

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await requireUser();
  const monthKey = resolveMonthKey((await searchParams).month);
  const previousMonthKey = shiftMonthKey(monthKey, -1);

  // O mês anterior vem junto só para alimentar o atalho "copiar".
  const [budget, previousBudget, categories] = await Promise.all([
    getBudgetForMonth(user.userId, monthKey),
    getBudgetForMonth(user.userId, previousMonthKey),
    listCategories(user.userId),
  ]);

  return (
    <PageContainer>
      <BudgetsView
        monthKey={monthKey}
        budget={budget}
        previousMonthKey={previousMonthKey}
        previousLines={previousBudget.lines.map((line) => ({
          categoryId: line.categoryId,
          plannedAmount: line.plannedAmount,
        }))}
        categories={categories.filter((c) => c.type === 'EXPENSE')}
      />
    </PageContainer>
  );
}
