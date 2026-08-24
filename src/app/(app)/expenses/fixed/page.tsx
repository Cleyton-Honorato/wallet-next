import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/PageContainer';
import { FixedEntriesView } from '@/features/entries/components/FixedEntriesView';
import { resolveMonthKey } from '@/lib/month';
import { requireUser } from '@/server/auth/session';
import { listCategories } from '@/server/services/categories';
import { listFixedExpenses } from '@/server/services/fixed-expenses';

export const metadata: Metadata = { title: 'Despesas Fixas — Wallet' };

export default async function FixedExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await requireUser();
  const monthKey = resolveMonthKey((await searchParams).month);

  const [entries, categories] = await Promise.all([
    listFixedExpenses(user.userId, monthKey),
    listCategories(user.userId),
  ]);

  return (
    <PageContainer>
      <FixedEntriesView
        kind="expense"
        monthKey={monthKey}
        entries={entries}
        categories={categories.filter((c) => c.type === 'EXPENSE')}
      />
    </PageContainer>
  );
}
