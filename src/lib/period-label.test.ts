import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolvePeriod } from './period-label';

/**
 * O período do dashboard vive na URL e tem três estados. Estes testes fixam o
 * contrato: sem parâmetro é mês corrente, `month=0` é anual.
 */

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 7, 29)); // 29/ago/2026
});

afterEach(() => {
  vi.useRealTimers();
});

describe('resolvePeriod', () => {
  it('sem parâmetro nenhum, abre no mês corrente', () => {
    expect(resolvePeriod({})).toEqual({ year: 2026, month: 8 });
  });

  it('com apenas o ano, mantém o mês corrente', () => {
    expect(resolvePeriod({ year: '2026' })).toEqual({ year: 2026, month: 8 });
  });

  it('month=0 é a escolha explícita de "Anual"', () => {
    expect(resolvePeriod({ year: '2026', month: '0' })).toEqual({
      year: 2026,
      month: undefined,
    });
  });

  it('respeita um mês específico', () => {
    expect(resolvePeriod({ year: '2026', month: '3' })).toEqual({
      year: 2026,
      month: 3,
    });
  });

  it('mês fora da faixa cai no mês corrente', () => {
    expect(resolvePeriod({ year: '2026', month: '13' }).month).toBe(8);
    expect(resolvePeriod({ year: '2026', month: '-2' }).month).toBe(8);
    expect(resolvePeriod({ year: '2026', month: 'abc' }).month).toBe(8);
  });

  it('mantém o mês corrente ao olhar um ano anterior', () => {
    expect(resolvePeriod({ year: '2025' })).toEqual({ year: 2025, month: 8 });
  });

  it('ano inválido ou fora da lista cai no ano corrente', () => {
    expect(resolvePeriod({ year: '1999' }).year).toBe(2026);
    expect(resolvePeriod({ year: 'xyz' }).year).toBe(2026);
  });
});
