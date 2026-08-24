'use client';

import { useState, type ReactNode } from 'react';
import { Bell, Menu, Moon, Search, Sun } from 'lucide-react';
import { COOKIES } from '@/lib/constants';
import styles from './Header.module.css';

export type Theme = 'light' | 'dark';

interface HeaderProps {
  user: { name: string };
  initialTheme: Theme;
  onOpenSidebar: () => void;
  /** Bloco de saldo — injetado pelo layout como server component. */
  balanceSlot?: ReactNode;
}

/**
 * Barra superior da área de conteúdo. A navegação vive na Sidebar.
 */
export function Header({
  user,
  initialTheme,
  onOpenSidebar,
  balanceSlot,
}: HeaderProps) {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  const firstName = user.name.split(' ')[0];

  // O cookie mantém a escolha; o dataset aplica sem esperar navegação.
  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    document.cookie = `${COOKIES.THEME}=${next}; path=/; max-age=31536000; samesite=lax`;
    setTheme(next);
  };

  return (
    <header className={styles.header}>
      <button
        type="button"
        className={styles.menuBtn}
        onClick={onOpenSidebar}
        aria-label="Abrir menu"
      >
        <Menu size={20} />
      </button>

      <label className={styles.search}>
        <Search size={16} className={styles.searchIcon} />
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Buscar transações, categorias…"
          aria-label="Buscar"
        />
      </label>

      <div className={styles.actions}>
        {balanceSlot}

        <span className={styles.divider} aria-hidden />

        <button
          type="button"
          className={styles.iconBtn}
          aria-label="Notificações"
        >
          <Bell size={18} />
          <span className={styles.badge} aria-hidden />
        </button>

        <button
          type="button"
          className={styles.iconBtn}
          onClick={toggleTheme}
          aria-label={
            theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'
          }
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className={styles.user} title={user.name}>
          <span className={styles.avatar}>
            {user.name.charAt(0).toUpperCase()}
          </span>
          <span className={styles.greeting}>Olá, {firstName}</span>
        </div>
      </div>
    </header>
  );
}
