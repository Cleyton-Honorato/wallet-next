'use client';

import { useEffect, useRef, useState, type TouchEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Gauge, LogOut, ShieldCheck, Tags, X, type LucideIcon } from 'lucide-react';
import { InstallAppRow } from '@/components/pwa/InstallAppRow';
import { cn } from '@/lib/cn';
import { lockScroll } from '@/lib/scroll-lock';
import { logoutAction } from '@/server/actions/auth';
import styles from './MobileDrawer.module.css';

const LINKS: { href: string; label: string; hint: string; icon: LucideIcon }[] = [
  { href: '/budgets', label: 'Limites de gasto', hint: 'Quanto gastar por categoria', icon: Gauge },
  { href: '/categories', label: 'Categorias', hint: 'Organize seus lançamentos', icon: Tags },
  { href: '/goals', label: 'Reserva de emergência', hint: 'Dinheiro para imprevistos', icon: ShieldCheck },
];

/** Arrastar mais que isso para a esquerda fecha o painel. */
const SWIPE_CLOSE_PX = 80;

interface MobileDrawerProps {
  id: string;
  open: boolean;
  onClose: () => void;
  user: { name: string; email: string };
}

/**
 * Menu lateral do celular: desliza da esquerda com os ajustes e a saída.
 *
 * Fica sempre montado para animar a saída também; fechado, vira `inert`
 * (fora do Tab e dos leitores de tela). Aberto, trava a rolagem do fundo,
 * fecha no Esc, no toque fora, no X ou arrastando para a esquerda, e devolve
 * o foco a quem o abriu.
 */
export function MobileDrawer({ id, open, onClose, user }: MobileDrawerProps) {
  const pathname = usePathname();
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const [dragX, setDragX] = useState(0);

  useEffect(() => {
    if (!open) return;

    returnFocusRef.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    const unlock = lockScroll();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      unlock();
      returnFocusRef.current?.focus({ preventScroll: true });
    };
  }, [open, onClose]);

  const onTouchStart = (event: TouchEvent) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const onTouchMove = (event: TouchEvent) => {
    if (touchStartX.current === null) return;
    // Só acompanha o dedo para a esquerda; para a direita o painel não sai.
    setDragX(Math.min(0, event.touches[0].clientX - touchStartX.current));
  };

  const onTouchEnd = () => {
    if (dragX < -SWIPE_CLOSE_PX) onClose();
    touchStartX.current = null;
    setDragX(0);
  };

  const initial = user.name.charAt(0).toUpperCase();

  return (
    <div className={cn(styles.root, open && styles.open)} inert={!open}>
      <div className={styles.overlay} onClick={onClose} aria-hidden />

      <aside
        id={id}
        className={cn(styles.panel, dragX !== 0 && styles.dragging)}
        style={dragX !== 0 ? { transform: `translateX(${dragX}px)` } : undefined}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className={styles.head}>
          <span className={styles.avatar} aria-hidden>
            {initial}
          </span>
          <span className={styles.who}>
            <span className={styles.name}>{user.name}</span>
            <span className={styles.email}>{user.email}</span>
          </span>
          <button
            ref={closeRef}
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav aria-label="Ajustes" className={styles.nav}>
          {LINKS.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                className={cn(styles.link, active && styles.linkActive)}
              >
                <span className={styles.linkIcon} aria-hidden>
                  <link.icon size={22} />
                </span>
                <span className={styles.linkText}>
                  <span className={styles.linkLabel}>{link.label}</span>
                  <span className={styles.linkHint}>{link.hint}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        <InstallAppRow />

        <form action={logoutAction} className={styles.logoutForm}>
          <button type="submit" className={styles.logout}>
            <LogOut size={20} aria-hidden />
            Sair da conta
          </button>
        </form>
      </aside>
    </div>
  );
}
