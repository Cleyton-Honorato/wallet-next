import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/PageContainer';
import {
  TransactionsView,
  type TransactionsFilter,
} from '@/features/transactions/TransactionsView';
import { resolveMonthKey } from '@/lib/month';
import { requireUser } from '@/server/auth/session';
import { listCategories } from '@/server/services/categories';
import { listMonthEntries } from '@/server/services/month-entries';

export const metadata: Metadata = { title: 'Lançamentos — Wallet' };

const FILTERS: Record<string, TransactionsFilter> = {
  out: 'out',
  in: 'in',
  pending: 'pending',
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; show?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const monthKey = resolveMonthKey(params.month);

  const [entries, categories] = await Promise.all([
    listMonthEntries(user.userId, monthKey),
    listCategories(user.userId),
  ]);

  return (
    <PageContainer>
      <TransactionsView
        monthKey={monthKey}
        entries={entries}
        categories={categories}
        initialFilter={FILTERS[params.show ?? ''] ?? 'all'}
      />
    </PageContainer>
  );
}
