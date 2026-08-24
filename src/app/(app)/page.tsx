import { PageContainer } from '@/components/layout/PageContainer';
import { DashboardView } from '@/features/dashboard/components/DashboardView';
import { resolvePeriod } from '@/lib/period-label';
import { requireUser } from '@/server/auth/session';
import { getEmergencyFund } from '@/server/services/emergency-fund';
import {
  getAnnualMatrix,
  getDashboardSummary,
} from '@/server/services/dashboard/queries';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const user = await requireUser();
  const period = resolvePeriod(await searchParams);

  const [summary, matrix, fund] = await Promise.all([
    getDashboardSummary(user.userId, period),
    getAnnualMatrix(user.userId, period.year),
    getEmergencyFund(user.userId),
  ]);

  return (
    <PageContainer>
      <DashboardView
        period={period}
        summary={summary}
        matrix={matrix}
        fund={fund}
      />
    </PageContainer>
  );
}
