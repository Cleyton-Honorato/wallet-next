'use client';

import { useCallback, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MobileDrawer } from './MobileDrawer';
import { isNavItemActive, navItems } from './navItems';
import { TabBar } from './TabBar';
import styles from './AppShell.module.css';

interface AppShellProps {
  user: { name: string; email: string };
  children: ReactNode;
}

/**
 * Casca da aplicação.
 *
 * - Celular: barra fina no topo com o ☰ (abre o menu lateral), o conteúdo e
 *   a barra de abas flutuante (TabBar).
 * - Computador: barra no topo com as mesmas abas e o avatar levando ao Perfil.
 */
export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const initial = user.name.charAt(0).toUpperCase();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);

  // Navegou (inclusive pelo "voltar"): o menu fecha.
  if (lastPath !== pathname) {
    setLastPath(pathname);
    if (drawerOpen) setDrawerOpen(false);
  }

  // Estável: o drawer usa no efeito que trava a rolagem e devolve o foco.
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <div className={styles.layout}>
      <div className={styles.mobilebar}>
        <button
          type="button"
          className={styles.menuBtn}
          onClick={() => setDrawerOpen(true)}
          aria-label="Abrir menu"
          aria-expanded={drawerOpen}
          aria-controls="mobile-drawer"
        >
          <Menu size={24} />
        </button>
        <Link href="/" className={styles.mobileBrand}>
          <Image src="/logo.png" alt="" width={28} height={28} />
          <span>Wallet</span>
        </Link>
      </div>

      <MobileDrawer
        id="mobile-drawer"
        open={drawerOpen}
        onClose={closeDrawer}
        user={user}
      />

      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <Link href="/" className={styles.brand}>
            <Image src="/logo.png" alt="" width={32} height={32} />
            <span>Wallet</span>
          </Link>

          <nav aria-label="Navegação principal" className={styles.topnav}>
            {navItems
              .filter((item) => item.to !== '/profile')
              .map((item) => {
                const active = isNavItemActive(pathname, item);
                return (
                  <Link
                    key={item.to}
                    href={item.to}
                    aria-current={active ? 'page' : undefined}
                    className={cn(styles.toplink, active && styles.toplinkActive)}
                  >
                    {item.label}
                  </Link>
                );
              })}
          </nav>

          <Link
            href="/profile"
            className={cn(
              styles.avatar,
              isNavItemActive(pathname, navItems[3]) && styles.avatarActive,
            )}
            aria-label={`Perfil de ${user.name}`}
          >
            {initial}
          </Link>
        </div>
      </header>

      <div className={styles.content}>{children}</div>

      <TabBar />
    </div>
  );
}
