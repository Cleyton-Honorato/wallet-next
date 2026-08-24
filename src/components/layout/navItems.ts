import {
  ArrowLeftRight,
  BarChart3,
  LayoutDashboard,
  PiggyBank,
  Repeat,
  Shuffle,
  Tags,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';

export interface NavLeaf {
  to: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavLeaf[];
}

export type NavEntry = NavLeaf | NavGroup;

export interface NavSection {
  label: string;
  entries: NavEntry[];
}

export function isNavGroup(entry: NavEntry): entry is NavGroup {
  return 'items' in entry;
}

export const navSections: NavSection[] = [
  {
    label: 'Menu',
    entries: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
      {
        id: 'expenses',
        label: 'Despesas',
        icon: TrendingDown,
        items: [
          { to: '/expenses/fixed', label: 'Fixas', icon: Repeat },
          { to: '/expenses/variable', label: 'Variáveis', icon: Shuffle },
        ],
      },
      {
        id: 'incomes',
        label: 'Receitas',
        icon: TrendingUp,
        items: [
          { to: '/incomes/fixed', label: 'Fixas', icon: Repeat },
          { to: '/incomes/variable', label: 'Variáveis', icon: Shuffle },
        ],
      },
      { to: '/transactions', label: 'Transações', icon: ArrowLeftRight },
    ],
  },
  {
    label: 'Gestão',
    entries: [
      { to: '/budgets', label: 'Orçamentos', icon: PiggyBank },
      { to: '/categories', label: 'Categorias', icon: Tags },
      { to: '/reports', label: 'Relatórios', icon: BarChart3 },
    ],
  },
];

/** True quando `pathname` está dentro de `to` (a raiz exige match exato). */
export function isRouteActive(pathname: string, to: string): boolean {
  return to === '/' ? pathname === '/' : pathname.startsWith(to);
}

/** Id do grupo que contém a rota atual, se houver. */
export function findActiveGroupId(pathname: string): string | null {
  for (const section of navSections) {
    for (const entry of section.entries) {
      if (
        isNavGroup(entry) &&
        entry.items.some((item) => isRouteActive(pathname, item.to))
      ) {
        return entry.id;
      }
    }
  }
  return null;
}
