'use client';

import { useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { isNavItemActive, navItems } from './navItems';
import styles from './TabBar.module.css';

/**
 * Barra de abas flutuante do celular.
 *
 * Um único marcador verde-lima desliza por baixo dos ícones até a aba
 * escolhida. Ele se move no toque, sem esperar a navegação terminar — a
 * resposta é imediata mesmo quando a página demora a chegar — e volta a
 * seguir a URL assim que ela muda (inclusive no "voltar" do navegador).
 */
export function TabBar() {
  const pathname = usePathname();
  const routeIndex = navItems.findIndex((item) => isNavItemActive(pathname, item));

  const [tapped, setTapped] = useState<number | null>(null);
  const [lastPath, setLastPath] = useState(pathname);

  // A URL mudou: a navegação chegou, o toque otimista já cumpriu seu papel.
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setTapped(null);
  }

  const activeIndex = tapped ?? routeIndex;

  return (
    <nav aria-label="Navegação principal" className={styles.dock}>
      <div
        className={styles.bar}
        style={{ '--active': Math.max(activeIndex, 0) } as CSSProperties}
      >
        <span
          className={cn(styles.indicator, activeIndex < 0 && styles.indicatorHidden)}
          aria-hidden
        />
        {navItems.map((item, index) => {
          const active = index === activeIndex;
          return (
            <Link
              key={item.to}
              href={item.to}
              aria-current={index === routeIndex ? 'page' : undefined}
              className={cn(styles.tab, active && styles.tabActive)}
              onClick={() => {
                if (index !== routeIndex) setTapped(index);
              }}
            >
              <item.icon size={24} strokeWidth={active ? 2.4 : 2} aria-hidden />
              {/* Só ícone na tela; o nome segue para leitores de tela. */}
              <span className={styles.srOnly}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
