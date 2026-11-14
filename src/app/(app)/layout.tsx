import { AppShell } from '@/components/layout/AppShell';
import { requireUser } from '@/server/auth/session';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <AppShell user={{ name: user.name, email: user.email }}>
      {children}
    </AppShell>
  );
}
