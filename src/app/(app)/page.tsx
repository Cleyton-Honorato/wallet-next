import { PageContainer } from '@/components/layout/PageContainer';
import { HomeView } from '@/features/home/HomeView';
import { resolveMonthKey } from '@/lib/month';
import { requireUser } from '@/server/auth/session';
import { listCategories } from '@/server/services/categories';
import { getDashboardSummary } from '@/server/services/dashboard/queries';
import { getEmergencyFund } from '@/server/services/emergency-fund';
import { listMonthEntries } from '@/server/services/month-entries';
import { getOverdueBills } from '@/server/services/overdue';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await requireUser();
  const monthKey = resolveMonthKey((await searchParams).month);
  const [year, month] = monthKey.split('-').map(Number);

  // Contas vencidas não recebem o mês de propósito: é um alerta sobre hoje,
  // não sobre o recorte que o usuário escolheu olhar.
  const [summary, overdue, fund, entries, categories] = await Promise.all([
    getDashboardSummary(user.userId, { year, month }),
    getOverdueBills(user.userId),
    getEmergencyFund(user.userId),
    listMonthEntries(user.userId, monthKey),
    listCategories(user.userId),
  ]);

  return (
    <PageContainer>
      <HomeView
        userName={user.name}
        monthKey={monthKey}
        summary={summary}
        overdue={overdue}
        fund={fund}
        entries={entries}
        categories={categories}
      />
    </PageContainer>
  );
}
