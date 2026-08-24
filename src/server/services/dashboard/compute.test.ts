import { describe, expect, it } from 'vitest';
import {
  aggregateMonthlySpent,
  buildExpensesByCategory,
  fixedRow,
  groupVariableByCategory,
  indexSettlements,
  isActiveInMonth,
  isMonthPast,
  isPastDue,
  sumFixedOverPeriod,
  sumRows,
  type CategoryInfo,
  type FixedItem,
} from './compute';
import { countActiveMonthsInPeriod, getPeriodBounds } from './period';

/**
 * Testes de caracterização: fixam o comportamento herdado do DashboardService
 * do NestJS, que não tinha cobertura. Uma mudança de resultado aqui é uma
 * mudança de regra de negócio, não um detalhe de implementação.
 */

const categories = new Map<number, CategoryInfo>([
  [1, { name: 'Moradia', color: '#4f6ef7' }],
  [2, { name: 'Alimentação', color: '#22c55e' }],
]);

function makeFixed(overrides: Partial<FixedItem> = {}): FixedItem {
  return {
    id: 1,
    title: 'Aluguel',
    categoryId: 1,
    amount: 2200,
    isActive: true,
    startDate: new Date(2026, 0, 1),
    endDate: null,
    day: 5,
    ...overrides,
  };
}

describe('countActiveMonthsInPeriod', () => {
  const yearBounds = getPeriodBounds(2026);

  it('conta os 12 meses de um item ativo o ano todo', () => {
    expect(
      countActiveMonthsInPeriod(new Date(2026, 0, 1), null, yearBounds),
    ).toBe(12);
  });

  it('conta só os meses restantes quando o item começa no meio do ano', () => {
    expect(
      countActiveMonthsInPeriod(new Date(2026, 6, 15), null, yearBounds),
    ).toBe(6); // julho a dezembro
  });

  it('para de contar no mês do término', () => {
    expect(
      countActiveMonthsInPeriod(
        new Date(2026, 0, 1),
        new Date(2026, 2, 31),
        yearBounds,
      ),
    ).toBe(3); // janeiro a março
  });

  it('conta zero quando o item termina antes do período', () => {
    expect(
      countActiveMonthsInPeriod(
        new Date(2024, 0, 1),
        new Date(2025, 11, 31),
        yearBounds,
      ),
    ).toBe(0);
  });

  it('conta sempre 1 na visão mensal', () => {
    const monthBounds = getPeriodBounds(2026, 8);
    expect(
      countActiveMonthsInPeriod(new Date(2020, 0, 1), null, monthBounds, 8),
    ).toBe(1);
  });
});

describe('isActiveInMonth', () => {
  it('aceita item sem término, a partir do início da vigência', () => {
    const item = makeFixed({ startDate: new Date(2026, 2, 15) });

    expect(isActiveInMonth(item, 2026, 1)).toBe(false); // fevereiro
    expect(isActiveInMonth(item, 2026, 2)).toBe(true); // março, mês do início
    expect(isActiveInMonth(item, 2026, 11)).toBe(true); // dezembro
  });

  it('exclui os meses posteriores ao término', () => {
    const item = makeFixed({
      startDate: new Date(2026, 0, 1),
      endDate: new Date(2026, 5, 30),
    });

    expect(isActiveInMonth(item, 2026, 5)).toBe(true); // junho, mês do fim
    expect(isActiveInMonth(item, 2026, 6)).toBe(false); // julho
  });

  it('nunca considera ativo um item inativo', () => {
    const item = makeFixed({ isActive: false });

    expect(isActiveInMonth(item, 2026, 5)).toBe(false);
  });
});

describe('aggregateMonthlySpent', () => {
  const fixed = (over: Partial<FixedItem> = {}) => makeFixed(over);

  it('soma fixas vigentes e variáveis na mesma categoria', () => {
    const spent = aggregateMonthlySpent(
      [fixed({ categoryId: 1, amount: 200 })],
      [{ categoryId: 1, month: '2026-08', amount: 80, settled: true }],
      2026,
      7,
    );

    expect(spent.get(1)).toBe(280);
  });

  it('separa os totais por categoria', () => {
    const spent = aggregateMonthlySpent(
      [fixed({ categoryId: 1, amount: 200 })],
      [{ categoryId: 2, month: '2026-08', amount: 80, settled: false }],
      2026,
      7,
    );

    expect(spent.get(1)).toBe(200);
    expect(spent.get(2)).toBe(80);
  });

  it('descarta fixa fora da vigência no mês pedido', () => {
    const spent = aggregateMonthlySpent(
      [
        fixed({
          categoryId: 1,
          amount: 200,
          startDate: new Date(2026, 0, 1),
          endDate: new Date(2026, 2, 31),
        }),
      ],
      [],
      2026,
      7, // agosto, depois do término em março
    );

    expect(spent.get(1)).toBeUndefined();
  });

  it('devolve mapa vazio sem lançamento algum', () => {
    expect(aggregateMonthlySpent([], [], 2026, 7).size).toBe(0);
  });
});

describe('sumFixedOverPeriod', () => {
  it('projeta o valor mensal sobre o ano inteiro', () => {
    const total = sumFixedOverPeriod(
      [makeFixed({ amount: 2200 })],
      getPeriodBounds(2026),
      undefined,
    );
    expect(total).toBe(2200 * 12);
  });

  it('usa o valor de um único mês na visão mensal', () => {
    const total = sumFixedOverPeriod(
      [makeFixed({ amount: 2200 })],
      getPeriodBounds(2026, 8),
      8,
    );
    expect(total).toBe(2200);
  });

  it('acumula por categoria através do callback', () => {
    const byCategory = new Map<number, number>();
    sumFixedOverPeriod(
      [makeFixed({ amount: 100 }), makeFixed({ id: 2, amount: 50 })],
      getPeriodBounds(2026, 3),
      3,
      (categoryId, amount) =>
        byCategory.set(categoryId, (byCategory.get(categoryId) ?? 0) + amount),
    );
    expect(byCategory.get(1)).toBe(150);
  });
});

describe('buildExpensesByCategory', () => {
  it('ordena do maior para o menor e arredonda os percentuais', () => {
    const result = buildExpensesByCategory(
      new Map([
        [1, 300],
        [2, 700],
      ]),
      categories,
    );

    expect(result.map((r) => r.categoryName)).toEqual([
      'Alimentação',
      'Moradia',
    ]);
    expect(result.map((r) => r.percentage)).toEqual([70, 30]);
    expect(result[0].color).toBe('#22c55e');
  });

  it('usa cor neutra e o id como nome quando a categoria sumiu', () => {
    const [row] = buildExpensesByCategory(new Map([[99, 10]]), categories);
    expect(row).toMatchObject({ categoryName: '99', color: '#6b7280' });
  });

  it('devolve 0% quando não há gasto algum', () => {
    const [row] = buildExpensesByCategory(new Map([[1, 0]]), categories);
    expect(row.percentage).toBe(0);
  });
});

describe('isPastDue', () => {
  const now = new Date(2026, 7, 22); // 22/ago/2026

  it('considera vencida uma conta cujo dia já passou no mês', () => {
    expect(isPastDue(2026, 7, 5, now)).toBe(true);
  });

  it('não considera vencida uma conta que ainda vai vencer', () => {
    expect(isPastDue(2026, 7, 28, now)).toBe(false);
  });

  it('limita o dia ao último do mês (dia 31 em fevereiro)', () => {
    // 31/fev vira 28/fev/2026, que já passou em agosto.
    expect(isPastDue(2026, 1, 31, now)).toBe(true);
    // O mesmo dia 31 em dezembro ainda não passou.
    expect(isPastDue(2026, 11, 31, now)).toBe(false);
  });
});

describe('isMonthPast', () => {
  const now = new Date(2026, 7, 22);

  it('o mês corrente ainda não passou', () => {
    expect(isMonthPast(2026, 7, now)).toBe(false);
  });

  it('meses anteriores já passaram', () => {
    expect(isMonthPast(2026, 6, now)).toBe(true);
  });
});

describe('indexSettlements', () => {
  it('agrupa os meses quitados por item', () => {
    const index = indexSettlements([
      { id: 1, month: '2026-01' },
      { id: 1, month: '2026-02' },
      { id: 2, month: '2026-01' },
    ]);

    expect(index.get(1)).toEqual(new Set(['2026-01', '2026-02']));
    expect(index.get(2)).toEqual(new Set(['2026-01']));
    expect(index.get(3)).toBeUndefined();
  });
});

describe('fixedRow', () => {
  const now = new Date(2026, 7, 22);

  it('preenche os 12 meses de um item ativo o ano todo', () => {
    const row = fixedRow(
      'fx-exp-1',
      'fixedExpense',
      makeFixed(),
      2026,
      new Map(),
      now,
    );
    expect(row.values).toHaveLength(12);
    expect(row.values.every((v) => v === 2200)).toBe(true);
  });

  it('zera os meses fora da janela de vigência', () => {
    const row = fixedRow(
      'fx-exp-1',
      'fixedExpense',
      makeFixed({
        startDate: new Date(2026, 2, 1),
        endDate: new Date(2026, 5, 30),
      }),
      2026,
      new Map(),
      now,
    );

    expect(row.values[1]).toBe(0); // fevereiro: antes do início
    expect(row.values[2]).toBe(2200); // março
    expect(row.values[5]).toBe(2200); // junho
    expect(row.values[6]).toBe(0); // julho: após o término
    expect(row.statuses[1]).toBe('none');
  });

  it('zera tudo quando o item está inativo', () => {
    const row = fixedRow(
      'fx-exp-1',
      'fixedExpense',
      makeFixed({ isActive: false }),
      2026,
      new Map(),
      now,
    );
    expect(row.values.every((v) => v === 0)).toBe(true);
    expect(row.statuses.every((s) => s === 'none')).toBe(true);
  });

  it('marca como quitado o mês com settlement, mesmo estando vencido', () => {
    const row = fixedRow(
      'fx-exp-1',
      'fixedExpense',
      makeFixed(),
      2026,
      new Map([[1, new Set(['2026-01'])]]),
      now,
    );
    expect(row.statuses[0]).toBe('paid');
  });

  it('marca despesa não quitada de mês passado como vencida', () => {
    const row = fixedRow(
      'fx-exp-1',
      'fixedExpense',
      makeFixed(),
      2026,
      new Map(),
      now,
    );
    expect(row.statuses[0]).toBe('overdue'); // janeiro
    expect(row.statuses[11]).toBe('pending'); // dezembro
  });

  it('nunca marca receita como vencida — só despesa vence', () => {
    const row = fixedRow(
      'fx-inc-1',
      'fixedIncome',
      makeFixed({ title: 'Salário' }),
      2026,
      new Map(),
      now,
    );
    expect(row.statuses.every((s) => s !== 'overdue')).toBe(true);
    expect(row.statuses[0]).toBe('pending');
  });
});

describe('groupVariableByCategory', () => {
  const now = new Date(2026, 7, 22);

  it('soma por categoria e mês', () => {
    const rows = groupVariableByCategory(
      [
        { categoryId: 2, month: '2026-08', amount: 100, settled: true },
        { categoryId: 2, month: '2026-08', amount: 50, settled: true },
        { categoryId: 1, month: '2026-08', amount: 900, settled: false },
      ],
      categories,
      'variableExpenseCategory',
      2026,
      now,
    );

    const food = rows.find((r) => r.refId === 2);
    expect(food?.values[7]).toBe(150);
    expect(food?.label).toBe('Alimentação');
    expect(food?.statuses[7]).toBe('paid');
  });

  it('marca parcial quando só parte dos lançamentos foi quitada', () => {
    const [row] = groupVariableByCategory(
      [
        { categoryId: 2, month: '2026-08', amount: 100, settled: true },
        { categoryId: 2, month: '2026-08', amount: 50, settled: false },
      ],
      categories,
      'variableExpenseCategory',
      2026,
      now,
    );
    expect(row.statuses[7]).toBe('partial');
  });

  it('marca despesa pendente de mês encerrado como vencida', () => {
    const [row] = groupVariableByCategory(
      [{ categoryId: 2, month: '2026-06', amount: 100, settled: false }],
      categories,
      'variableExpenseCategory',
      2026,
      now,
    );
    expect(row.statuses[5]).toBe('overdue'); // junho já acabou
  });

  it('nunca marca receita como vencida', () => {
    const [row] = groupVariableByCategory(
      [{ categoryId: 2, month: '2026-06', amount: 100, settled: false }],
      categories,
      'variableIncomeCategory',
      2026,
      now,
    );
    expect(row.statuses[5]).toBe('pending');
  });

  it('ignora meses fora da faixa 1–12', () => {
    const rows = groupVariableByCategory(
      [{ categoryId: 2, month: '2026-13', amount: 100, settled: false }],
      categories,
      'variableExpenseCategory',
      2026,
      now,
    );
    expect(rows).toHaveLength(0);
  });

  it('deixa como "none" os meses sem lançamento', () => {
    const [row] = groupVariableByCategory(
      [{ categoryId: 2, month: '2026-08', amount: 100, settled: false }],
      categories,
      'variableExpenseCategory',
      2026,
      now,
    );
    expect(row.statuses[0]).toBe('none');
    expect(row.values[0]).toBe(0);
  });
});

describe('sumRows', () => {
  it('soma coluna a coluna e devolve sempre 12 posições', () => {
    const rows = [
      fixedRow('a', 'fixedExpense', makeFixed({ amount: 100 }), 2026, new Map()),
      fixedRow(
        'b',
        'fixedExpense',
        makeFixed({ id: 2, amount: 50 }),
        2026,
        new Map(),
      ),
    ];
    const totals = sumRows(rows);
    expect(totals).toHaveLength(12);
    expect(totals.every((t) => t === 150)).toBe(true);
  });

  it('devolve zeros quando não há linhas', () => {
    expect(sumRows([])).toEqual(new Array(12).fill(0));
  });
});
