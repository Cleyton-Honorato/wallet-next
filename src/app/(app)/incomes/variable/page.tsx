import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/PageContainer';
import { VariableEntriesView } from '@/features/entries/components/VariableEntriesView';
import { resolveMonthKey } from '@/lib/month';
import { requireUser } from '@/server/auth/session';
import { listCategories } from '@/server/services/categories';
import { listVariableIncomes } from '@/server/services/variable-incomes';

export const metadata: Metadata = { title: 'Receitas Variáveis — Wallet' };

export default async function VariableIncomesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await requireUser();
  const monthKey = resolveMonthKey((await searchParams).month);

  const [entries, categories] = await Promise.all([
    listVariableIncomes(user.userId, monthKey),
    listCategories(user.userId),
  ]);

  return (
    <PageContainer>
      <VariableEntriesView
        kind="income"
        monthKey={monthKey}
        entries={entries}
        categories={categories.filter((c) => c.type === 'INCOME')}
      />
    </PageContainer>
  );
}
