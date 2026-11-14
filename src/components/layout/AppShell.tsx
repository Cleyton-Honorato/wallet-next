'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { isNavItemActive, navItems } from './navItems';
import styles from './AppShell.module.css';

interface AppShellProps {
  user: { name: string; email: string };
  children: ReactNode;
}

/**
 * Casca da aplicação.
 *
 * - Celular: só o conteúdo e uma barra de 4 abas fixa embaixo.
 * - Computador: barra no topo com as mesmas abas e o avatar levando ao Perfil.
 */
export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const initial = user.name.charAt(0).toUpperCase();

  return (
    <div className={styles.layout}>
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

      <nav aria-label="Navegação principal" className={styles.tabbar}>
        {navItems.map((item) => {
          const active = isNavItemActive(pathname, item);
          return (
            <Link
              key={item.to}
              href={item.to}
              aria-current={active ? 'page' : undefined}
              className={cn(styles.tab, active && styles.tabActive)}
            >
              <span className={styles.tabIcon}>
                <item.icon size={22} strokeWidth={active ? 2.4 : 2} />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
