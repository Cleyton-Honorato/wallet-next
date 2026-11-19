/**
 * Paleta de cores de categorias e metas — alinhada à branding do Wallet
 * (azul-marinho #002366, verde #00C853, marrom #501300, cinzas Neutral).
 *
 * Em vez dos 20 tons saturados antigos (estilo Tailwind), 9 tons sóbrios: o
 * azul é o da marca, o verde e o laranja saem das escalas Secondary e
 * Tertiary, e os demais completam o círculo de cores no mesmo peso.
 * Cada tom tem a cor forte (ícone, barra) e um fundo suave (atrás do ícone);
 * a forte passa contraste 4.5:1 sobre o suave e sobre o branco.
 *
 * Vive em `lib` porque categorias, metas, limites e o Início usam.
 */

export interface BrandTone {
  id: string;
  name: string;
  color: string;
  soft: string;
}

export const BRAND_TONES: readonly BrandTone[] = [
  { id: 'verde', name: 'Verde', color: '#007A35', soft: '#E0F7EA' },
  { id: 'teal', name: 'Verde-água', color: '#0F7275', soft: '#E0F3F2' },
  { id: 'azul', name: 'Azul', color: '#002366', soft: '#E3E9F5' },
  { id: 'roxo', name: 'Roxo', color: '#6E3FC4', soft: '#F0EAFC' },
  { id: 'rosa', name: 'Rosa', color: '#B42C6A', soft: '#FCE8F1' },
  { id: 'vermelho', name: 'Vermelho', color: '#B42318', soft: '#FDECEA' },
  { id: 'laranja', name: 'Laranja', color: '#9A3B1A', soft: '#FBE9DF' },
  { id: 'oliva', name: 'Oliva', color: '#5E7A00', soft: '#EEF9CC' },
  { id: 'grafite', name: 'Grafite', color: '#4A5059', soft: '#EEF0F3' },
] as const;

/** O que os seletores de cor oferecem — só os tons da paleta. */
export const AVAILABLE_COLORS = BRAND_TONES.map((tone) => tone.color);

const GRAPHITE = BRAND_TONES[BRAND_TONES.length - 1];

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const n = parseInt(match[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };

  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s, l };
}

function hueDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

const TONE_HUES = BRAND_TONES.filter((tone) => tone !== GRAPHITE).map((tone) => ({
  tone,
  hue: hexToHsl(tone.color)!.h,
}));

/**
 * O tom da paleta para qualquer cor salva no banco.
 *
 * Cores que já são da paleta voltam como estão. As antigas (saturadas) caem
 * no tom de matiz mais próxima — azul vira o azul sóbrio, verde o verde —
 * e cinzas viram grafite. Assim o que o usuário escolheu continua
 * reconhecível, mas a tela segue o design.
 */
export function brandTone(color: string | null | undefined): BrandTone {
  if (!color) return GRAPHITE;
  const exact = BRAND_TONES.find((tone) => tone.color.toLowerCase() === color.toLowerCase());
  if (exact) return exact;

  const hsl = hexToHsl(color);
  if (!hsl || hsl.s < 0.2) return GRAPHITE;

  return TONE_HUES.reduce((best, current) =>
    hueDistance(current.hue, hsl.h) < hueDistance(best.hue, hsl.h) ? current : best,
  ).tone;
}
