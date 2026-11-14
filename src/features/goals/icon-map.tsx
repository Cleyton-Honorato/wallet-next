import { createElement } from 'react';
import {
  Award,
  Briefcase,
  Car,
  CreditCard,
  GraduationCap,
  Gift,
  Heart,
  Home,
  Laptop,
  PiggyBank,
  Plane,
  ShoppingBag,
  Star,
  Target,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

/**
 * Ícones de objetivo — mapa explícito, como em categorias: só o que é usado
 * entra no bundle.
 */
const ICONS = {
  Target,
  Plane,
  Home,
  Car,
  GraduationCap,
  Gift,
  Heart,
  Laptop,
  PiggyBank,
  ShoppingBag,
  Star,
  TrendingUp,
  Wallet,
  Award,
  Briefcase,
  CreditCard,
} satisfies Record<string, LucideIcon>;

export type GoalIconName = keyof typeof ICONS;

export const AVAILABLE_GOAL_ICONS = Object.keys(ICONS) as GoalIconName[];

function resolveGoalIcon(name: string | null | undefined): LucideIcon {
  if (name && name in ICONS) return ICONS[name as GoalIconName];
  return Target;
}

/** `createElement` em vez de JSX: o componente vem de um mapa estático. */
export function GoalIcon({
  name,
  size,
  color,
}: {
  name: string | null | undefined;
  size: number;
  color?: string;
}) {
  return createElement(resolveGoalIcon(name), { size, color });
}
