import { describe, expect, it } from 'vitest';
import {
  clampDueDay,
  coversMonth,
  daysLate,
  daysLateMonthEnd,
  daysUntilDue,
  groupByMonth,
  isFixedEntryOverdue,
  isMonthPast,
  isPastDue,
  isVariableEntryOverdue,
  monthKeyOfDate,
  parseMonthKey,
  summarizeByAge,
  toMonthKey,
} from './overdue';

/** 29 de agosto de 2026, meio-dia. */
const now = new Date(2026, 7, 29, 12, 0, 0);

/** Despesa fixa vigente desde janeiro, vencendo todo dia 5. */
const fixa = {
  settled: false,
  isActive: true,
  day: 5,
  startDate: '2026-01-01',
  endDate: null as string | null,
};

describe('clampDueDay', () => {
  it('respeita o dia quando ele existe no mês', () => {
    expect(clampDueDay(2026, 7, 5)).toBe(5);
  });

  it('encolhe o dia 31 para o último dia de fevereiro', () => {
    expect(clampDueDay(2026, 1, 31)).toBe(28);
    expect(clampDueDay(2028, 1, 31)).toBe(29); // bissexto
  });
});

describe('isPastDue', () => {
  it('o dia do vencimento ainda está em dia', () => {
    expect(isPastDue(2026, 7, 29, now)).toBe(false);
  });

  it('vence quando o dia termina', () => {
    expect(isPastDue(2026, 7, 28, now)).toBe(true);
  });

  it('mês futuro nunca está vencido', () => {
    expect(isPastDue(2026, 11, 1, now)).toBe(false);
  });
});

describe('isMonthPast', () => {
  it('o mês corrente ainda não terminou', () => {
    expect(isMonthPast(2026, 7, now)).toBe(false);
  });

  it('o mês anterior terminou', () => {
    expect(isMonthPast(2026, 6, now)).toBe(true);
  });
});

describe('daysLate', () => {
  it('conta os dias desde o vencimento', () => {
    expect(daysLate(2026, 7, 5, now)).toBe(24);
  });

  it('é zero no próprio dia do vencimento', () => {
    expect(daysLate(2026, 7, 29, now)).toBe(0);
  });

  it('nunca é negativo para vencimento futuro', () => {
    expect(daysLate(2026, 11, 10, now)).toBe(0);
  });

  it('usa o dia encolhido quando o mês é mais curto', () => {
    // fevereiro de 2026 acaba no dia 28, então o "dia 31" venceu ali
    expect(daysLate(2026, 1, 31, new Date(2026, 2, 3, 12))).toBe(3);
  });
});

describe('daysLateMonthEnd', () => {
  it('conta a partir do último dia do mês', () => {
    expect(daysLateMonthEnd(2026, 6, now)).toBe(29); // 31/07 → 29/08
  });

  it('é zero enquanto o mês não terminou', () => {
    expect(daysLateMonthEnd(2026, 7, now)).toBe(0);
  });
});

describe('daysUntilDue', () => {
  it('conta os dias que faltam', () => {
    expect(daysUntilDue(2026, 8, 5, now)).toBe(7); // 29/08 → 05/09
  });

  it('é zero no dia do vencimento', () => {
    expect(daysUntilDue(2026, 7, 29, now)).toBe(0);
  });

  it('é zero para vencimento já passado', () => {
    expect(daysUntilDue(2026, 7, 5, now)).toBe(0);
  });
});

describe('summarizeByAge', () => {
  const items = [
    { daysLate: 236, amount: 550 },
    { daysLate: 181, amount: 100 },
    { daysLate: 180, amount: 200 },
    { daysLate: 90, amount: 300 },
    { daysLate: 89, amount: 400 },
    { daysLate: 0, amount: 50 },
  ];

  it('separa nas três faixas, sem sobreposição nas bordas', () => {
    expect(summarizeByAge(items)).toEqual([
      { tone: 'critical', label: 'Mais de 180 dias', count: 2, total: 650 },
      { tone: 'high', label: '90 a 180 dias', count: 2, total: 500 },
      { tone: 'moderate', label: 'Até 90 dias', count: 2, total: 450 },
    ]);
  });

  it('omite faixa vazia', () => {
    const buckets = summarizeByAge([{ daysLate: 10, amount: 1 }]);
    expect(buckets).toHaveLength(1);
    expect(buckets[0].tone).toBe('moderate');
  });

  it('lista vazia não gera faixa', () => {
    expect(summarizeByAge([])).toEqual([]);
  });
});

describe('groupByMonth', () => {
  it('agrupa somando e ordena do mês mais antigo para o mais novo', () => {
    const groups = groupByMonth([
      { month: '2026-03', amount: 550 },
      { month: '2026-01', amount: 550 },
      { month: '2026-01', amount: 1450 },
    ]);

    expect(groups.map((g) => [g.month, g.total, g.items.length])).toEqual([
      ['2026-01', 2000, 2],
      ['2026-03', 550, 1],
    ]);
  });

  it('preserva a ordem de entrada dentro do grupo', () => {
    const groups = groupByMonth([
      { month: '2026-01', amount: 1 },
      { month: '2026-01', amount: 2 },
    ]);
    expect(groups[0].items.map((i) => i.amount)).toEqual([1, 2]);
  });
});

describe('chave de mês', () => {
  it('vai e volta', () => {
    expect(toMonthKey(2026, 6)).toBe('2026-07');
    expect(parseMonthKey('2026-07')).toEqual({ year: 2026, monthIndex: 6 });
  });

  it('rejeita o que não é mês', () => {
    expect(parseMonthKey('2026-13')).toBeNull();
    expect(parseMonthKey('2026-7')).toBeNull();
    expect(parseMonthKey('agosto')).toBeNull();
  });
});

describe('vigência por mês', () => {
  it('a data pura do banco não escorrega para o mês anterior', () => {
    // `@db.Date` volta como meia-noite UTC; em São Paulo isso é 21h do dia 30
    // de junho, e ler os componentes locais colocaria a despesa em junho.
    expect(monthKeyOfDate(new Date('2026-07-01'))).toBe('2026-07');
    expect(coversMonth(monthKeyOfDate(new Date('2026-07-01')), null, '2026-06')).toBe(
      false,
    );
  });

  it('cobre do mês de início ao mês de término, inclusive', () => {
    expect(coversMonth('2026-03', '2026-06', '2026-03')).toBe(true);
    expect(coversMonth('2026-03', '2026-06', '2026-06')).toBe(true);
    expect(coversMonth('2026-03', '2026-06', '2026-02')).toBe(false);
    expect(coversMonth('2026-03', '2026-06', '2026-07')).toBe(false);
  });

  it('sem término, cobre para sempre', () => {
    expect(coversMonth('2026-03', null, '2030-12')).toBe(true);
  });
});

describe('isFixedEntryOverdue', () => {
  it('vencida quando o dia passou e não foi paga', () => {
    expect(isFixedEntryOverdue(fixa, '2026-08', now)).toBe(true);
  });

  it('paga não vence', () => {
    expect(
      isFixedEntryOverdue({ ...fixa, settled: true }, '2026-08', now),
    ).toBe(false);
  });

  it('inativa não vence', () => {
    expect(
      isFixedEntryOverdue({ ...fixa, isActive: false }, '2026-08', now),
    ).toBe(false);
  });

  it('não vence antes do dia, no mês corrente', () => {
    expect(isFixedEntryOverdue({ ...fixa, day: 30 }, '2026-08', now)).toBe(
      false,
    );
  });

  it('não vence em mês anterior ao início da vigência', () => {
    expect(
      isFixedEntryOverdue({ ...fixa, startDate: '2026-08-01' }, '2026-07', now),
    ).toBe(false);
  });

  it('não vence depois de encerrada', () => {
    expect(
      isFixedEntryOverdue({ ...fixa, endDate: '2026-06-30' }, '2026-07', now),
    ).toBe(false);
  });

  it('vence no mês em que a vigência termina', () => {
    expect(
      isFixedEntryOverdue({ ...fixa, endDate: '2026-07-31' }, '2026-07', now),
    ).toBe(true);
  });
});

describe('isVariableEntryOverdue', () => {
  it('vencida quando o mês acabou e não foi paga', () => {
    expect(isVariableEntryOverdue({ settled: false }, '2026-07', now)).toBe(
      true,
    );
  });

  it('o mês corrente ainda não venceu', () => {
    expect(isVariableEntryOverdue({ settled: false }, '2026-08', now)).toBe(
      false,
    );
  });

  it('paga não vence', () => {
    expect(isVariableEntryOverdue({ settled: true }, '2026-07', now)).toBe(
      false,
    );
  });
});
