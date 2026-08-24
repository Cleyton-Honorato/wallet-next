import { createElement } from 'react';
import {
  Award,
  Briefcase,
  Building,
  Car,
  CreditCard,
  Circle,
  DollarSign,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  Heart,
  Home,
  Laptop,
  PawPrint,
  Phone,
  PiggyBank,
  Plane,
  Receipt,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Star,
  Tag,
  TrendingUp,
  Users,
  UtensilsCrossed,
  Wallet,
  Wifi,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { CategoryType } from '@/lib/types';

/**
 * Mapa explícito em vez de `import * as Icons` com lookup dinâmico: só os
 * ícones realmente usados entram no bundle.
 */
const ICONS = {
  Award,
  Briefcase,
  Building,
  Car,
  Circle,
  CreditCard,
  DollarSign,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  Heart,
  Home,
  Laptop,
  PawPrint,
  Phone,
  PiggyBank,
  Plane,
  Receipt,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Star,
  Tag,
  TrendingUp,
  Users,
  UtensilsCrossed,
  Wallet,
  Wifi,
  Wrench,
  Zap,
} satisfies Record<string, LucideIcon>;

export type CategoryIconName = keyof typeof ICONS;

function resolveCategoryIcon(name: string | null | undefined): LucideIcon {
  if (name && name in ICONS) return ICONS[name as CategoryIconName];
  return Tag;
}

/**
 * Renderiza o ícone de uma categoria.
 *
 * Usa `createElement` em vez de `<Icon />`: o componente vem de um mapa
 * estático, mas escrever a variável como JSX faria o React Compiler tratá-la
 * como um componente criado a cada render.
 */
export function CategoryIcon({
  name,
  size,
  color,
}: {
  name: string | null | undefined;
  size: number;
  color?: string;
}) {
  return createElement(resolveCategoryIcon(name), { size, color });
}

export const AVAILABLE_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
  '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
  '#EC4899', '#F43F5E', '#64748B', '#6B7280', '#374151',
] as const;

export const AVAILABLE_ICONS: Record<CategoryType, CategoryIconName[]> = {
  INCOME: [
    'Briefcase', 'Laptop', 'TrendingUp', 'ShoppingBag', 'DollarSign',
    'PiggyBank', 'Gift', 'Award', 'Star', 'Circle',
  ],
  EXPENSE: [
    'CreditCard', 'Wallet', 'Receipt', 'UtensilsCrossed', 'Car',
    'Home', 'Heart', 'GraduationCap', 'Gamepad2', 'ShoppingCart',
    'Plane', 'Shirt', 'Fuel', 'Phone', 'Zap',
    'Wifi', 'Building', 'Users', 'PawPrint', 'Wrench',
  ],
};
