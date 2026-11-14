import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/server/db';
import { getOverdueBills, settleAllOverdue } from './overdue';

/**
 * Integração contra o Postgres de desenvolvimento. Requer `docker compose up -d`
 * no wallet-api.
 *
 * O relógio é sempre injetado: 29 de agosto de 2026. Sem isso os casos
 * mudariam de resultado conforme o dia em que a suíte roda.
 */

const now = new Date(2026, 7, 29, 12, 0, 0);

let ownerId: number;
let intruderId: number;
let expenseCategoryId: number;
let incomeCategoryId: number;

async function upsertUser(email: string, name: string) {
  return db.user.upsert({
    where: { email },
    update: {},
    create: { name, email, passwordHash: 'x' },
  });
}

/** Ordem importa: lançamentos referenciam categorias. */
async function wipe(ids: number[]) {
  await db.fixedExpense.deleteMany({ where: { userId: { in: ids } } });
  await db.variableExpense.deleteMany({ where: { userId: { in: ids } } });
  await db.fixedIncome.deleteMany({ where: { userId: { in: ids } } });
  await db.variableIncome.deleteMany({ where: { userId: { in: ids } } });
}

beforeAll(async () => {
  const owner = await upsertUser('vitest-overdue-owner@wallet.test', 'Dono');
  const intruder = await upsertUser(
    'vitest-overdue-intruder@wallet.test',
    'Intruso',
  );
  ownerId = owner.id;
  intruderId = intruder.id;

  // Resíduo de uma rodada interrompida quebraria o unique da categoria.
  await wipe([ownerId, intruderId]);
  await db.category.deleteMany({
    where: { userId: { in: [ownerId, intruderId] } },
  });

  expenseCategoryId = (
    await db.category.create({
      data: {
        userId: ownerId,
        name: 'Moradia (teste)',
        type: 'EXPENSE',
        color: '#123456',
      },
    })
  ).id;
  incomeCategoryId = (
    await db.category.create({
      data: {
        userId: ownerId,
        name: 'Salário (teste)',
        type: 'INCOME',
        color: '#654321',
      },
    })
  ).id;
});

beforeEach(async () => {
  await wipe([ownerId, intruderId]);
});

afterAll(async () => {
  const ids = [ownerId, intruderId];
  await wipe(ids);
  await db.category.deleteMany({ where: { userId: { in: ids } } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
  await db.$disconnect();
});

/** Fixa vigente desde julho, vencendo todo dia 5. */
function criarFixa(overrides: Record<string, unknown> = {}) {
  return db.fixedExpense.create({
    data: {
      userId: ownerId,
      categoryId: expenseCategoryId,
      title: 'Aluguel',
      amount: 1200,
      dueDay: 5,
      startDate: new Date('2026-07-01'),
      ...overrides,
    },
  });
}

function criarVariavel(overrides: Record<string, unknown> = {}) {
  return db.variableExpense.create({
    data: {
      userId: ownerId,
      categoryId: expenseCategoryId,
      title: 'Mercado',
      estimatedAmount: 400,
      month: '2026-07',
      ...overrides,
    },
  });
}

describe('despesas fixas', () => {
  it('gera uma cobrança por mês vencido e em aberto', async () => {
    await criarFixa();

    const { items, count, total } = await getOverdueBills(ownerId, now);

    expect(count).toBe(2);
    expect(total).toBe(2400);
    // do mais atrasado para o menos: julho (55 dias) antes de agosto (24)
    expect(items.map((i) => [i.month, i.daysLate])).toEqual([
      ['2026-07', 55],
      ['2026-08', 24],
    ]);
    expect(items[0]).toMatchObject({
      kind: 'fixed',
      title: 'Aluguel',
      categoryName: 'Moradia (teste)',
      color: '#123456',
      amount: 1200,
    });
  });

  it('some o mês que já foi quitado', async () => {
    const fixa = await criarFixa();
    await db.fixedExpenseSettlement.create({
      data: { fixedExpenseId: fixa.id, month: '2026-07', paid: true },
    });

    const { items, count } = await getOverdueBills(ownerId, now);

    expect(count).toBe(1);
    expect(items[0].month).toBe('2026-08');
  });

  it('ignora quitação desmarcada', async () => {
    const fixa = await criarFixa();
    await db.fixedExpenseSettlement.create({
      data: { fixedExpenseId: fixa.id, month: '2026-07', paid: false },
    });

    expect((await getOverdueBills(ownerId, now)).count).toBe(2);
  });

  it('não cobra o mês corrente antes do vencimento', async () => {
    await criarFixa({ dueDay: 30 });

    const { items } = await getOverdueBills(ownerId, now);

    expect(items.map((i) => i.month)).toEqual(['2026-07']);
  });

  it('ignora despesa inativa', async () => {
    await criarFixa({ isActive: false });

    expect((await getOverdueBills(ownerId, now)).count).toBe(0);
  });

  it('ignora meses fora da vigência', async () => {
    await criarFixa({ endDate: new Date('2026-07-31') });

    const { items } = await getOverdueBills(ownerId, now);

    expect(items.map((i) => i.month)).toEqual(['2026-07']);
  });
});

describe('despesas variáveis', () => {
  it('cobra o lançamento não pago de mês encerrado', async () => {
    await criarVariavel();

    const { items, count, total } = await getOverdueBills(ownerId, now);

    expect(count).toBe(1);
    expect(total).toBe(400);
    expect(items[0]).toMatchObject({
      kind: 'variable',
      title: 'Mercado',
      month: '2026-07',
      daysLate: 29, // 31/07 → 29/08
      amount: 400,
    });
  });

  it('usa o valor efetivo quando ele já foi informado', async () => {
    await criarVariavel({ actualAmount: 465.9 });

    expect((await getOverdueBills(ownerId, now)).items[0].amount).toBe(465.9);
  });

  it('não cobra o mês corrente, que ainda não terminou', async () => {
    await criarVariavel({ month: '2026-08' });

    expect((await getOverdueBills(ownerId, now)).count).toBe(0);
  });

  it('ignora lançamento já pago', async () => {
    await criarVariavel({ isPaid: true, actualAmount: 400 });

    expect((await getOverdueBills(ownerId, now)).count).toBe(0);
  });
});

describe('próxima a pagar', () => {
  it('aponta o vencimento mais próximo ainda em aberto', async () => {
    await criarFixa({ dueDay: 30 }); // vence em 30/08, daqui a 1 dia
    await criarFixa({ title: 'Internet', dueDay: 10, amount: 120 });

    const { next } = await getOverdueBills(ownerId, now);

    expect(next).toMatchObject({
      title: 'Aluguel',
      dueDate: '2026-08-30',
      daysUntil: 1,
      categoryName: 'Moradia (teste)',
      month: '2026-08',
    });
  });

  it('atravessa para o mês seguinte quando o corrente já venceu tudo', async () => {
    await criarFixa(); // dia 5: já venceu em agosto

    const { next } = await getOverdueBills(ownerId, now);

    expect(next).toMatchObject({ dueDate: '2026-09-05', month: '2026-09' });
  });

  it('pula o mês que já foi quitado', async () => {
    const fixa = await criarFixa({ dueDay: 30 });
    await db.fixedExpenseSettlement.create({
      data: { fixedExpenseId: fixa.id, month: '2026-08', paid: true },
    });

    expect((await getOverdueBills(ownerId, now)).next).toMatchObject({
      dueDate: '2026-09-30',
    });
  });

  it('é nula quando a vigência termina antes', async () => {
    await criarFixa({ dueDay: 30, endDate: new Date('2026-07-31') });

    expect((await getOverdueBills(ownerId, now)).next).toBeNull();
  });

  it('não enxerga despesa de outro usuário', async () => {
    await criarFixa({ dueDay: 30 });

    expect((await getOverdueBills(intruderId, now)).next).toBeNull();
  });
});

describe('quitação em massa', () => {
  it('quita fixas e variáveis de uma vez e esvazia o painel', async () => {
    await criarFixa();
    const variavel = await criarVariavel();

    const { settled } = await settleAllOverdue(ownerId, now);

    expect(settled).toBe(3);
    const depois = await getOverdueBills(ownerId, now);
    expect(depois.count).toBe(0);
    expect(depois.total).toBe(0);

    // a variável recebe o valor exibido como efetivo
    const atualizada = await db.variableExpense.findUniqueOrThrow({
      where: { id: variavel.id },
    });
    expect(atualizada.isPaid).toBe(true);
    expect(Number(atualizada.actualAmount)).toBe(400);
  });

  it('não toca no que ainda não venceu', async () => {
    await criarFixa({ dueDay: 30 }); // agosto ainda em dia

    await settleAllOverdue(ownerId, now);

    const quitados = await db.fixedExpenseSettlement.findMany({
      where: { fixedExpense: { userId: ownerId } },
      select: { month: true },
    });
    expect(quitados.map((q) => q.month)).toEqual(['2026-07']);
  });

  it('não quita conta de outro usuário', async () => {
    await criarFixa();

    expect(await settleAllOverdue(intruderId, now)).toEqual({ settled: 0 });
    expect((await getOverdueBills(ownerId, now)).count).toBe(2);
  });

  it('sem nada vencido, não faz nada', async () => {
    expect(await settleAllOverdue(ownerId, now)).toEqual({ settled: 0 });
  });
});

describe('escopo', () => {
  it('receita nunca vence', async () => {
    await db.fixedIncome.create({
      data: {
        userId: ownerId,
        categoryId: incomeCategoryId,
        title: 'Salário',
        amount: 5000,
        receiptDay: 5,
        startDate: new Date('2026-07-01'),
      },
    });
    await db.variableIncome.create({
      data: {
        userId: ownerId,
        categoryId: incomeCategoryId,
        title: 'Freela',
        estimatedAmount: 800,
        month: '2026-07',
      },
    });

    expect((await getOverdueBills(ownerId, now)).count).toBe(0);
  });

  it('não mistura as contas de outro usuário', async () => {
    await criarFixa();

    expect((await getOverdueBills(intruderId, now)).count).toBe(0);
  });

  it('não olha para outro ano', async () => {
    await criarVariavel({ month: '2025-11' });

    expect((await getOverdueBills(ownerId, now)).count).toBe(0);
  });

  it('soma fixas e variáveis no mesmo total', async () => {
    await criarFixa();
    await criarVariavel();

    const { count, total } = await getOverdueBills(ownerId, now);

    expect(count).toBe(3);
    expect(total).toBe(2800);
  });
});
