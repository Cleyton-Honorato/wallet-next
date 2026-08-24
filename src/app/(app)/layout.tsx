import { cookies } from 'next/headers';
import { AppShell } from '@/components/layout/AppShell';
import { COOKIES } from '@/lib/constants';
import { requireUser } from '@/server/auth/session';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const cookieStore = await cookies();

  return (
    <AppShell
      user={{ name: user.name, email: user.email }}
      initialTheme={
        cookieStore.get(COOKIES.THEME)?.value === 'light' ? 'light' : 'dark'
      }
      initialCollapsed={
        cookieStore.get(COOKIES.SIDEBAR_COLLAPSED)?.value === 'true'
      }
    >
      {children}
    </AppShell>
  );
}
