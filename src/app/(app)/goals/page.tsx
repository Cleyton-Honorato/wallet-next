import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/PageContainer';
import { GoalsView } from '@/features/goals/components/GoalsView';
import { requireUser } from '@/server/auth/session';
import { getEmergencyFund } from '@/server/services/emergency-fund';
import { listGoals } from '@/server/services/goals';

export const metadata: Metadata = { title: 'Metas — Wallet' };

export default async function GoalsPage() {
  const user = await requireUser();
  const [goals, fund] = await Promise.all([
    listGoals(user.userId),
    getEmergencyFund(user.userId),
  ]);

  return (
    <PageContainer>
      <GoalsView goals={goals} fund={fund} />
    </PageContainer>
  );
}
