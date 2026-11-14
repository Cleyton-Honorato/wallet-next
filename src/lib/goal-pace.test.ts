import { describe, expect, it } from 'vitest';
import { monthsRemaining, suggestedMonthly } from './goal-pace';

const hoje = new Date(2026, 7, 29); // 29/ago/2026

describe('monthsRemaining', () => {
  it('conta o mês corrente como um mês para guardar', () => {
    expect(monthsRemaining('2026-08-31', hoje)).toBe(1);
  });

  it('conta os meses até a data-alvo', () => {
    expect(monthsRemaining('2026-12-01', hoje)).toBe(5); // ago..dez
  });

  it('atravessa a virada do ano', () => {
    expect(monthsRemaining('2027-02-01', hoje)).toBe(7);
  });

  it('devolve 0 para prazo já vencido', () => {
    expect(monthsRemaining('2026-07-31', hoje)).toBe(0);
  });

  it('devolve 0 para data malformada', () => {
    expect(monthsRemaining('', hoje)).toBe(0);
  });
});

describe('suggestedMonthly', () => {
  it('divide o que falta pelos meses restantes', () => {
    expect(suggestedMonthly(5000, 5)).toBe(1000);
  });

  it('arredonda para cima, para não faltar no último mês', () => {
    expect(suggestedMonthly(1000, 3)).toBe(334);
  });

  it('devolve 0 quando o objetivo já foi atingido', () => {
    expect(suggestedMonthly(0, 5)).toBe(0);
  });

  it('devolve 0 quando não há mais prazo', () => {
    expect(suggestedMonthly(5000, 0)).toBe(0);
  });
});
