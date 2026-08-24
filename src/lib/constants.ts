/** Constantes da aplicação. */

export const APP_NAME = 'Wallet';

export const DEFAULT_CURRENCY = 'BRL';
export const DEFAULT_LOCALE = 'pt-BR';

/** Cookies (o de sessão é httpOnly e vive só no servidor). */
export const COOKIES = {
  SESSION: 'wallet_session',
  THEME: 'wallet_theme',
  SIDEBAR_COLLAPSED: 'wallet_sidebar_collapsed',
} as const;

export const DASHBOARD_AVAILABLE_YEARS = [2024, 2025, 2026] as const;

export const DASHBOARD_MONTH_OPTIONS = [
  { value: 0, label: 'Anual' },
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
] as const;

export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  DISPLAY_WITH_TIME: 'dd/MM/yyyy HH:mm',
  API: 'yyyy-MM-dd',
  MONTH_YEAR: 'MMMM yyyy',
  SHORT_MONTH: 'MMM yyyy',
} as const;
