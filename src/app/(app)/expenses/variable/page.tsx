import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/PageContainer';
import { VariableEntriesView } from '@/features/entries/components/VariableEntriesView';
import { resolveMonthKey } from '@/lib/month';
import { requireUser } from '@/server/auth/session';
import { listCategories } from '@/server/services/categories';
import { listVariableExpenses } from '@/server/services/variable-expenses';

export const metadata: Metadata = { title: 'Despesas Variáveis — Wallet' };

export default async function VariableExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await requireUser();
  const monthKey = resolveMonthKey((await searchParams).month);

  const [entries, categories] = await Promise.all([
    listVariableExpenses(user.userId, monthKey),
    listCategories(user.userId),
  ]);

  return (
    <PageContainer>
      <VariableEntriesView
        kind="expense"
        monthKey={monthKey}
        entries={entries}
        categories={categories.filter((c) => c.type === 'EXPENSE')}
      />
    </PageContainer>
  );
}
