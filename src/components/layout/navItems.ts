import { House, List, Target, UserRound, type LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Rotas que também acendem esta aba (telas que vivem "dentro" dela). */
  also?: string[];
}

/**
 * Quatro destinos, nada de submenus: o que antes eram 8 itens e 2 grupos
 * agora cabe em abas que o polegar alcança. Orçamento, categorias e reserva
 * moram no Perfil.
 */
export const navItems: NavItem[] = [
  { to: '/', label: 'Início', icon: House },
  { to: '/transactions', label: 'Lançamentos', icon: List },
  { to: '/goals', label: 'Metas', icon: Target },
  {
    to: '/profile',
    label: 'Perfil',
    icon: UserRound,
    also: ['/budgets', '/categories'],
  },
];

function matches(pathname: string, to: string): boolean {
  return to === '/' ? pathname === '/' : pathname.startsWith(to);
}

/** True quando `pathname` pertence à aba (a raiz exige match exato). */
export function isNavItemActive(pathname: string, item: NavItem): boolean {
  return (
    matches(pathname, item.to) ||
    (item.also ?? []).some((path) => matches(pathname, path))
  );
}
