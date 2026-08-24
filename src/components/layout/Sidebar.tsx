'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronLeft, LogOut } from 'lucide-react';
import { cn } from '@/lib/cn';
import { logoutAction } from '@/server/actions/auth';
import {
  findActiveGroupId,
  isNavGroup,
  isRouteActive,
  navSections,
  type NavGroup,
} from './navItems';
import styles from './Sidebar.module.css';

interface SidebarProps {
  user: { name: string; email: string };
  /** Rail mode: só ícones (desktop). */
  collapsed: boolean;
  onToggleCollapsed: () => void;
  /** Drawer (mobile). */
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  user,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const [openGroup, setOpenGroup] = useState<string | null>(() =>
    findActiveGroupId(pathname),
  );
  const [lastPath, setLastPath] = useState(pathname);

  // Mantém expandido o grupo que contém a rota atual após navegar.
  if (lastPath !== pathname) {
    setLastPath(pathname);
    const active = findActiveGroupId(pathname);
    if (active && active !== openGroup) setOpenGroup(active);
  }

  const isGroupActive = (group: NavGroup) =>
    group.items.some((item) => isRouteActive(pathname, item.to));

  const renderSubLinks = (group: NavGroup) =>
    group.items.map((item) => (
      <Link
        key={item.to}
        href={item.to}
        onClick={onCloseMobile}
        className={cn(
          styles.subLink,
          isRouteActive(pathname, item.to) && styles.subLinkActive,
        )}
      >
        <item.icon size={16} className={styles.subLinkIcon} />
        <span>{item.label}</span>
      </Link>
    ));

  return (
    <>
      <div
        className={cn(styles.overlay, mobileOpen && styles.overlayVisible)}
        onClick={onCloseMobile}
        aria-hidden
      />

      <aside
        className={cn(
          styles.sidebar,
          collapsed && styles.collapsed,
          mobileOpen && styles.sidebarOpen,
        )}
        aria-label="Navegação principal"
      >
        <div className={styles.brand}>
          <Link href="/" className={styles.logoArea} onClick={onCloseMobile}>
            <span className={styles.logoIcon}>
              <Image src="/logo.png" alt="" width={28} height={28} />
            </span>
            <span className={styles.logoText}>Wallet</span>
          </Link>

          <button
            type="button"
            className={styles.collapseBtn}
            onClick={onToggleCollapsed}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            <ChevronLeft size={16} className={styles.collapseIcon} />
          </button>
        </div>

        <nav className={styles.nav}>
          {navSections.map((section) => (
            <div key={section.label} className={styles.section}>
              <span className={styles.sectionLabel}>{section.label}</span>

              {section.entries.map((entry) =>
                isNavGroup(entry) ? (
                  <div key={entry.id} className={styles.group}>
                    <button
                      type="button"
                      className={cn(
                        styles.link,
                        isGroupActive(entry) && styles.linkActiveSoft,
                      )}
                      onClick={() =>
                        setOpenGroup((prev) =>
                          prev === entry.id ? null : entry.id,
                        )
                      }
                      aria-expanded={openGroup === entry.id}
                      title={entry.label}
                    >
                      <entry.icon className={styles.linkIcon} size={20} />
                      <span className={styles.linkText}>{entry.label}</span>
                      <ChevronDown
                        size={16}
                        className={cn(
                          styles.caret,
                          openGroup === entry.id && styles.caretOpen,
                        )}
                      />
                    </button>

                    <div
                      className={cn(
                        styles.submenu,
                        openGroup === entry.id && styles.submenuOpen,
                      )}
                    >
                      {renderSubLinks(entry)}
                    </div>

                    {/* Rail mode: os filhos aparecem em um flyout no hover. */}
                    <div className={styles.flyout}>
                      <span className={styles.flyoutTitle}>{entry.label}</span>
                      {renderSubLinks(entry)}
                    </div>
                  </div>
                ) : (
                  <Link
                    key={entry.to}
                    href={entry.to}
                    onClick={onCloseMobile}
                    title={entry.label}
                    className={cn(
                      styles.link,
                      isRouteActive(pathname, entry.to) && styles.linkActive,
                    )}
                  >
                    <entry.icon className={styles.linkIcon} size={20} />
                    <span className={styles.linkText}>{entry.label}</span>
                  </Link>
                ),
              )}
            </div>
          ))}
        </nav>

        <div className={styles.footer}>
          <div className={styles.user}>
            <span className={styles.avatar}>
              {user.name.charAt(0).toUpperCase()}
            </span>
            <span className={styles.userInfo}>
              <span className={styles.userName}>{user.name}</span>
              <span className={styles.userEmail}>{user.email}</span>
            </span>
          </div>

          <form action={logoutAction}>
            <button type="submit" className={styles.link} title="Sair">
              <LogOut className={styles.linkIcon} size={20} />
              <span className={styles.linkText}>Sair</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
