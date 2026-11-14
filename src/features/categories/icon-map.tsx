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

/**
 * Categorias sem ícone salvo (as do sistema, por exemplo) ganham um pelo
 * nome. Chaves já normalizadas: minúsculas e sem acento.
 */
const ICON_BY_LABEL: [RegExp, CategoryIconName][] = [
  [/moradia|casa|aluguel|condominio/, 'Home'],
  [/mercado|supermercado|feira/, 'ShoppingCart'],
  [/aliment|comida|restaurante|lanche|delivery/, 'UtensilsCrossed'],
  [/transporte|uber|onibus|carro/, 'Car'],
  [/combustivel|gasolina/, 'Fuel'],
  [/saude|farmacia|medic/, 'Heart'],
  [/educa|curso|escola|faculdade/, 'GraduationCap'],
  [/lazer|diversao|jogo|streaming/, 'Gamepad2'],
  [/conta|luz|energia|agua/, 'Zap'],
  [/internet/, 'Wifi'],
  [/telefone|celular/, 'Phone'],
  [/viagem/, 'Plane'],
  [/roupa|vestuario/, 'Shirt'],
  [/pet|animal/, 'PawPrint'],
  [/cartao|credito/, 'CreditCard'],
  [/salario/, 'Briefcase'],
  [/freela|servico/, 'Laptop'],
  [/invest|rendimento|dividendo/, 'TrendingUp'],
  [/venda/, 'ShoppingBag'],
  [/presente|doacao/, 'Gift'],
  [/bonus|premio|13/, 'Award'],
];

function normalize(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function resolveCategoryIcon(
  name: string | null | undefined,
  label?: string,
): LucideIcon {
  if (name && name in ICONS) return ICONS[name as CategoryIconName];
  if (label) {
    const key = normalize(label);
    const match = ICON_BY_LABEL.find(([pattern]) => pattern.test(key));
    if (match) return ICONS[match[1]];
  }
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
  label,
  size,
  color,
}: {
  name: string | null | undefined;
  /** Nome da categoria — usado para escolher um ícone quando `name` falta. */
  label?: string;
  size: number;
  color?: string;
}) {
  return createElement(resolveCategoryIcon(name, label), { size, color });
}

export { AVAILABLE_COLORS } from '@/lib/palette';

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
