import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/server/db';
import {
  deleteBudget,
  getBudgetForMonth,
  getSpentByCategory,
  upsertBudget,
} from './budgets';

/**
 * Integração contra o Postgres de desenvolvimento — a regra de "quanto já
 * gastei" e o escopo por usuário só valem se o banco real as sustentar.
 * Requer `docker compose up -d` no wallet-api.
 */

const MONTH = '2031-03'; // ano distante: não colide com dados reais
const OTHER_MONTH = '2031-04';

let ownerId: number;
let intruderId: number;
let foodId: number; // categoria de despesa do dono
let homeId: number; // segunda categoria de despesa do dono
let salaryId: number; // categoria de RECEITA do dono
let systemCategoryId: number; // categoria global (userId null)
let intruderCategoryId: number;

beforeAll(async () => {
  const owner = await db.user.upsert({
    where: { email: 'vitest-budget-owner@wallet.test' },
    update: {},
    create: {
      name: 'Dono',
      email: 'vitest-budget-owner@wallet.test',
      passwordHash: 'x',
    },
  });
  const intruder = await db.user.upsert({
    where: { email: 'vitest-budget-intruder@wallet.test' },
    update: {},
    create: {
      name: 'Intruso',
      email: 'vitest-budget-intruder@wallet.test',
      passwordHash: 'x',
    },
  });
  ownerId = owner.id;
  intruderId = intruder.id;

  const system = await db.category.findFirst({
    where: { userId: null, type: 'EXPENSE' },
  });
  if (!system) {
    throw new Error('rode `npm run db:seed` antes: falta categoria de sistema');
  }
  systemCategoryId = system.id;

  const mk = async (userId: number, name: string, type: 'EXPENSE' | 'INCOME') =>
    (
      await db.category.create({
        data: { userId, name, type, color: '#123456' },
      })
    ).id;

  foodId = await mk(ownerId, 'Alimentação (teste)', 'EXPENSE');
  homeId = await mk(ownerId, 'Moradia (teste)', 'EXPENSE');
  salaryId = await mk(ownerId, 'Salário (teste)', 'INCOME');
  intruderCategoryId = await mk(intruderId, 'Privada (teste)', 'EXPENSE');
});

beforeEach(async () => {
  const ids = [ownerId, intruderId];
  await db.monthlyBudget.deleteMany({ where: { userId: { in: ids } } });
  await db.variableExpense.deleteMany({ where: { userId: { in: ids } } });
  await db.fixedExpense.deleteMany({ where: { userId: { in: ids } } });
});

afterAll(async () => {
  const ids = [ownerId, intruderId];
  await db.monthlyBudget.deleteMany({ where: { userId: { in: ids } } });
  await db.variableExpense.deleteMany({ where: { userId: { in: ids } } });
  await db.fixedExpense.deleteMany({ where: { userId: { in: ids } } });
  await db.category.deleteMany({ where: { userId: { in: ids } } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
  await db.$disconnect();
});

describe('getBudgetForMonth', () => {
  it('devolve DTO vazio com id nulo quando o mês não tem orçamento', async () => {
    const budget = await getBudgetForMonth(ownerId, MONTH);

    expect(budget).toMatchObject({
      id: null,
      month: MONTH,
      totalPlanned: 0,
      totalSpent: 0,
      lines: [],
    });
  });

  it('não expõe o orçamento de outro usuário', async () => {
    await upsertBudget(ownerId, {
      month: MONTH,
      lines: [{ categoryId: foodId, plannedAmount: 500 }],
    });

    expect((await getBudgetForMonth(intruderId, MONTH)).id).toBeNull();
  });

  it('ordena as linhas do maior planejado para o menor', async () => {
    await upsertBudget(ownerId, {
      month: MONTH,
      lines: [
        { categoryId: foodId, plannedAmount: 300 },
        { categoryId: homeId, plannedAmount: 1200 },
      ],
    });

    const budget = await getBudgetForMonth(ownerId, MONTH);
    expect(budget.lines.map((l) => l.plannedAmount)).toEqual([1200, 300]);
  });
});

describe('upsertBudget', () => {
  it('cria o orçamento somando o total planejado das linhas', async () => {
    const budget = await upsertBudget(ownerId, {
      month: MONTH,
      lines: [
        { categoryId: foodId, plannedAmount: 800 },
        { categoryId: homeId, plannedAmount: 1200 },
      ],
    });

    expect(budget.id).not.toBeNull();
    expect(budget.totalPlanned).toBe(2000);
    expect(budget.lines).toHaveLength(2);
  });

  it('substitui as linhas por inteiro no segundo envio', async () => {
    await upsertBudget(ownerId, {
      month: MONTH,
      lines: [
        { categoryId: foodId, plannedAmount: 800 },
        { categoryId: homeId, plannedAmount: 1200 },
      ],
    });
    const updated = await upsertBudget(ownerId, {
      month: MONTH,
      lines: [{ categoryId: foodId, plannedAmount: 500 }],
    });

    expect(updated.lines).toHaveLength(1);
    expect(updated.lines[0]).toMatchObject({ categoryId: foodId, plannedAmount: 500 });
    expect(updated.totalPlanned).toBe(500);
  });

  it('mantém o mesmo registro de orçamento ao atualizar', async () => {
    const first = await upsertBudget(ownerId, {
      month: MONTH,
      lines: [{ categoryId: foodId, plannedAmount: 100 }],
    });
    const second = await upsertBudget(ownerId, {
      month: MONTH,
      lines: [{ categoryId: homeId, plannedAmount: 200 }],
    });

    expect(second.id).toBe(first.id);
  });

  it('aceita planejado zero', async () => {
    const budget = await upsertBudget(ownerId, {
      month: MONTH,
      lines: [{ categoryId: foodId, plannedAmount: 0 }],
    });

    expect(budget.totalPlanned).toBe(0);
  });

  it('aceita categoria global do sistema', async () => {
    const budget = await upsertBudget(ownerId, {
      month: MONTH,
      lines: [{ categoryId: systemCategoryId, plannedAmount: 300 }],
    });

    expect(budget.lines[0].categoryId).toBe(systemCategoryId);
  });

  it('rejeita a mesma categoria repetida', async () => {
    await expect(
      upsertBudget(ownerId, {
        month: MONTH,
        lines: [
          { categoryId: foodId, plannedAmount: 100 },
          { categoryId: foodId, plannedAmount: 200 },
        ],
      }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('rejeita categoria de receita', async () => {
    await expect(
      upsertBudget(ownerId, {
        month: MONTH,
        lines: [{ categoryId: salaryId, plannedAmount: 100 }],
      }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('trata categoria de outro usuário como inexistente', async () => {
    await expect(
      upsertBudget(ownerId, {
        month: MONTH,
        lines: [{ categoryId: intruderCategoryId, plannedAmount: 100 }],
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('não grava nada quando uma das linhas é inválida', async () => {
    await expect(
      upsertBudget(ownerId, {
        month: MONTH,
        lines: [
          { categoryId: foodId, plannedAmount: 100 },
          { categoryId: salaryId, plannedAmount: 200 },
        ],
      }),
    ).rejects.toBeTruthy();

    expect((await getBudgetForMonth(ownerId, MONTH)).id).toBeNull();
  });
});

describe('deleteBudget', () => {
  it('remove o orçamento junto com as linhas', async () => {
    const budget = await upsertBudget(ownerId, {
      month: MONTH,
      lines: [{ categoryId: foodId, plannedAmount: 100 }],
    });

    await deleteBudget(ownerId, MONTH);

    expect((await getBudgetForMonth(ownerId, MONTH)).id).toBeNull();
    expect(
      await db.budgetLine.count({ where: { budgetId: budget.id! } }),
    ).toBe(0);
  });

  it('falha para mês sem orçamento', async () => {
    await expect(deleteBudget(ownerId, MONTH)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('não deixa um usuário excluir o orçamento de outro', async () => {
    await upsertBudget(ownerId, {
      month: MONTH,
      lines: [{ categoryId: foodId, plannedAmount: 100 }],
    });

    await expect(deleteBudget(intruderId, MONTH)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
    expect((await getBudgetForMonth(ownerId, MONTH)).id).not.toBeNull();
  });
});

describe('gasto realizado (fixas + variáveis)', () => {
  const criarFixa = (amount: number, start: string, end?: string) =>
    db.fixedExpense.create({
      data: {
        userId: ownerId,
        categoryId: foodId,
        title: 'Fixa',
        amount,
        dueDay: 10,
        isActive: true,
        startDate: new Date(start),
        endDate: end ? new Date(end) : null,
      },
    });

  const criarVariavel = (
    month: string,
    estimated: number,
    actual: number | null,
  ) =>
    db.variableExpense.create({
      data: {
        userId: ownerId,
        categoryId: foodId,
        title: 'Variável',
        estimatedAmount: estimated,
        actualAmount: actual,
        month,
        isPaid: actual !== null,
      },
    });

  it('soma despesa fixa vigente com despesa variável do mês', async () => {
    await criarFixa(200, '2031-01-01');
    await criarVariavel(MONTH, 100, 80);

    expect((await getSpentByCategory(ownerId, MONTH)).get(foodId)).toBe(280);
  });

  it('usa o estimado da variável enquanto o efetivo não for informado', async () => {
    await criarVariavel(MONTH, 150, null);

    expect((await getSpentByCategory(ownerId, MONTH)).get(foodId)).toBe(150);
  });

  it('ignora fixa cuja vigência terminou antes do mês', async () => {
    await criarFixa(200, '2031-01-01', '2031-02-28');

    expect((await getSpentByCategory(ownerId, MONTH)).get(foodId)).toBeUndefined();
  });

  it('ignora fixa que só começa depois do mês', async () => {
    await criarFixa(200, '2031-06-01');

    expect((await getSpentByCategory(ownerId, MONTH)).get(foodId)).toBeUndefined();
  });

  it('ignora fixa inativa', async () => {
    const fixa = await criarFixa(200, '2031-01-01');
    await db.fixedExpense.update({
      where: { id: fixa.id },
      data: { isActive: false },
    });

    expect((await getSpentByCategory(ownerId, MONTH)).get(foodId)).toBeUndefined();
  });

  it('ignora variável de outro mês', async () => {
    await criarVariavel(OTHER_MONTH, 999, 999);

    expect((await getSpentByCategory(ownerId, MONTH)).get(foodId)).toBeUndefined();
  });

  it('não mistura gasto de outro usuário', async () => {
    await criarVariavel(MONTH, 100, 100);
    await db.variableExpense.create({
      data: {
        userId: intruderId,
        categoryId: intruderCategoryId,
        title: 'Do intruso',
        estimatedAmount: 500,
        actualAmount: 500,
        month: MONTH,
        isPaid: true,
      },
    });

    const spent = await getSpentByCategory(ownerId, MONTH);
    expect(spent.get(foodId)).toBe(100);
    expect(spent.get(intruderCategoryId)).toBeUndefined();
  });

  it('reflete o realizado na linha do orçamento e no total', async () => {
    await criarFixa(200, '2031-01-01');
    await criarVariavel(MONTH, 100, null);

    const budget = await upsertBudget(ownerId, {
      month: MONTH,
      lines: [{ categoryId: foodId, plannedAmount: 400 }],
    });

    expect(budget.lines[0]).toMatchObject({
      spentAmount: 300,
      remaining: 100,
      usagePercent: 75,
    });
    expect(budget.totalSpent).toBe(300);
    expect(budget.usagePercent).toBe(75);
  });

  it('marca estouro quando o gasto passa do planejado', async () => {
    await criarVariavel(MONTH, 500, 500);

    const budget = await upsertBudget(ownerId, {
      month: MONTH,
      lines: [{ categoryId: foodId, plannedAmount: 400 }],
    });

    expect(budget.lines[0]).toMatchObject({
      spentAmount: 500,
      remaining: 0, // nunca negativo
      usagePercent: 125,
    });
  });
});
