import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/PageContainer';
import { ProfileView } from '@/features/profile/ProfileView';
import { requireUser } from '@/server/auth/session';

export const metadata: Metadata = { title: 'Perfil — Wallet' };

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <PageContainer>
      <ProfileView name={user.name} email={user.email} />
    </PageContainer>
  );
}
