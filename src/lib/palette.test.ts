import { describe, expect, it } from 'vitest';
import { AVAILABLE_COLORS, BRAND_TONES, brandTone } from './palette';

describe('brandTone', () => {
  it('devolve o próprio tom para cores que já são da paleta', () => {
    for (const tone of BRAND_TONES) {
      expect(brandTone(tone.color)).toBe(tone);
      expect(brandTone(tone.color.toLowerCase())).toBe(tone);
    }
  });

  it('leva as cores antigas para o tom de matiz mais próxima', () => {
    const cases: [string, string][] = [
      ['#4f6ef7', 'azul'], // Moradia (seed)
      ['#3B82F6', 'azul'],
      ['#6366F1', 'azul'],
      ['#22c55e', 'verde'], // Alimentação (seed)
      ['#10B981', 'verde'],
      ['#14B8A6', 'teal'],
      ['#06B6D4', 'teal'],
      ['#EF4444', 'vermelho'],
      ['#F97316', 'laranja'],
      ['#F59E0B', 'laranja'],
      ['#84CC16', 'oliva'],
      ['#8B5CF6', 'roxo'],
      ['#A855F7', 'roxo'],
      ['#EC4899', 'rosa'],
    ];
    for (const [legacy, expected] of cases) {
      expect(brandTone(legacy).id, legacy).toBe(expected);
    }
  });

  it('manda cinzas, cores inválidas e vazias para grafite', () => {
    expect(brandTone('#6b7280').id).toBe('grafite');
    expect(brandTone('#374151').id).toBe('grafite');
    expect(brandTone('azul').id).toBe('grafite');
    expect(brandTone(null).id).toBe('grafite');
  });

  it('oferece nos seletores exatamente os tons da paleta', () => {
    expect(AVAILABLE_COLORS).toEqual(BRAND_TONES.map((tone) => tone.color));
  });
});
