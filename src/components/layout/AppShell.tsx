'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { COOKIES } from '@/lib/constants';
import { Header, type Theme } from './Header';
import { Sidebar } from './Sidebar';
import styles from './AppLayout.module.css';

interface AppShellProps {
  user: { name: string; email: string };
  initialTheme: Theme;
  initialCollapsed: boolean;
  balanceSlot?: ReactNode;
  children: ReactNode;
}

/**
 * Casca da aplicação: Sidebar fixa à esquerda, coluna de conteúdo à direita
 * com um Header fino acima da página.
 */
export function AppShell({
  user,
  initialTheme,
  initialCollapsed,
  balanceSlot,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);

  // Fecha o drawer ao navegar (inclui o botão "voltar" do navegador).
  if (lastPath !== pathname) {
    setLastPath(pathname);
    if (mobileOpen) setMobileOpen(false);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMobileOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Evita rolar o conteúdo por trás do drawer.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      document.cookie = `${COOKIES.SIDEBAR_COLLAPSED}=${next}; path=/; max-age=31536000; samesite=lax`;
      return next;
    });
  };

  return (
    <div className={styles.layout} data-collapsed={collapsed}>
      <Sidebar
        user={user}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className={styles.main}>
        <Header
          user={user}
          initialTheme={initialTheme}
          onOpenSidebar={() => setMobileOpen(true)}
          balanceSlot={balanceSlot}
        />
        {children}
      </div>
    </div>
  );
}
