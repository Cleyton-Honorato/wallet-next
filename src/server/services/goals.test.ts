import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/server/db';
import { getDashboardSummary } from '@/server/services/dashboard/queries';
import {
  addGoalMovement,
  createGoal,
  deleteGoal,
  listGoals,
  updateGoal,
} from './goals';

/**
 * Integração contra o Postgres de desenvolvimento. Requer `docker compose up -d`
 * no wallet-api.
 */

let ownerId: number;
let intruderId: number;
let categoryId: number; // categoria de despesa do dono, para o teste de saldo

const novoObjetivo = {
  name: 'Viagem',
  color: '#4f6ef7',
  targetAmount: 5000,
};

beforeAll(async () => {
  const owner = await db.user.upsert({
    where: { email: 'vitest-goal-owner@wallet.test' },
    update: {},
    create: {
      name: 'Dono',
      email: 'vitest-goal-owner@wallet.test',
      passwordHash: 'x',
    },
  });
  const intruder = await db.user.upsert({
    where: { email: 'vitest-goal-intruder@wallet.test' },
    update: {},
    create: {
      name: 'Intruso',
      email: 'vitest-goal-intruder@wallet.test',
      passwordHash: 'x',
    },
  });
  ownerId = owner.id;
  intruderId = intruder.id;

  // Limpa resíduo de execuções interrompidas: sem isto, uma rodada que falhe
  // no meio deixa a categoria criada e a seguinte quebra no unique.
  await db.variableExpense.deleteMany({ where: { userId: { in: [ownerId, intruderId] } } });
  await db.variableIncome.deleteMany({ where: { userId: { in: [ownerId, intruderId] } } });
  await db.category.deleteMany({ where: { userId: { in: [ownerId, intruderId] } } });

  categoryId = (
    await db.category.create({
      data: {
        userId: ownerId,
        name: 'Testes de objetivo',
        type: 'EXPENSE',
        color: '#123456',
      },
    })
  ).id;
});

beforeEach(async () => {
  const ids = [ownerId, intruderId];
  await db.goal.deleteMany({ where: { userId: { in: ids } } });
  await db.variableExpense.deleteMany({ where: { userId: { in: ids } } });
  await db.variableIncome.deleteMany({ where: { userId: { in: ids } } });
});

afterAll(async () => {
  const ids = [ownerId, intruderId];
  await db.goal.deleteMany({ where: { userId: { in: ids } } });
  await db.variableExpense.deleteMany({ where: { userId: { in: ids } } });
  await db.variableIncome.deleteMany({ where: { userId: { in: ids } } });
  await db.category.deleteMany({ where: { userId: { in: ids } } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
  await db.$disconnect();
});

describe('CRUD', () => {
  it('cria um objetivo zerado e com progresso em zero', async () => {
    const goal = await createGoal(ownerId, novoObjetivo);

    expect(goal).toMatchObject({
      name: 'Viagem',
      targetAmount: 5000,
      balance: 0,
      remaining: 5000,
      usagePercent: 0,
      completed: false,
      targetDate: null,
      movements: [],
    });
  });

  it('guarda a data-alvo quando informada', async () => {
    const goal = await createGoal(ownerId, {
      ...novoObjetivo,
      targetDate: '2026-12-31',
    });
    expect(goal.targetDate).toBe('2026-12-31');
  });

  it('recusa nome repetido para o mesmo usuário', async () => {
    await createGoal(ownerId, novoObjetivo);

    await expect(createGoal(ownerId, novoObjetivo)).rejects.toMatchObject({
      code: 'CONFLICT',
    });
  });

  it('permite o mesmo nome para usuários diferentes', async () => {
    await createGoal(ownerId, novoObjetivo);
    await expect(createGoal(intruderId, novoObjetivo)).resolves.toMatchObject({
      name: 'Viagem',
    });
  });

  it('edita meta e limpa a data-alvo', async () => {
    const goal = await createGoal(ownerId, {
      ...novoObjetivo,
      targetDate: '2026-12-31',
    });

    const updated = await updateGoal(ownerId, goal.id, {
      targetAmount: 8000,
      targetDate: null,
    });

    expect(updated).toMatchObject({ targetAmount: 8000, targetDate: null });
  });

  it('lista apenas os objetivos do próprio usuário', async () => {
    await createGoal(ownerId, novoObjetivo);
    await createGoal(intruderId, { ...novoObjetivo, name: 'Do intruso' });

    const doDono = await listGoals(ownerId);
    expect(doDono).toHaveLength(1);
    expect(doDono[0].name).toBe('Viagem');
  });

  it('remove o objetivo junto com as movimentações', async () => {
    const goal = await createGoal(ownerId, novoObjetivo);
    await addGoalMovement(ownerId, goal.id, {
      type: 'DEPOSIT',
      amount: 100,
      date: '2026-08-10',
    });

    await deleteGoal(ownerId, goal.id);

    expect(await listGoals(ownerId)).toHaveLength(0);
    expect(await db.goalMovement.count({ where: { goalId: goal.id } })).toBe(0);
  });
});

describe('escopo por usuário', () => {
  it('não deixa editar objetivo alheio', async () => {
    const goal = await createGoal(ownerId, novoObjetivo);

    await expect(
      updateGoal(intruderId, goal.id, { name: 'Invadido' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('não deixa excluir objetivo alheio', async () => {
    const goal = await createGoal(ownerId, novoObjetivo);

    await expect(deleteGoal(intruderId, goal.id)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('não deixa movimentar objetivo alheio', async () => {
    const goal = await createGoal(ownerId, novoObjetivo);

    await expect(
      addGoalMovement(intruderId, goal.id, {
        type: 'DEPOSIT',
        amount: 100,
        date: '2026-08-10',
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('aportes e resgates', () => {
  it('aporte soma ao saldo e move o progresso', async () => {
    const goal = await createGoal(ownerId, novoObjetivo);

    const updated = await addGoalMovement(ownerId, goal.id, {
      type: 'DEPOSIT',
      amount: 1250,
      date: '2026-08-10',
    });

    expect(updated).toMatchObject({
      balance: 1250,
      remaining: 3750,
      usagePercent: 25,
      completed: false,
    });
    expect(updated.movements).toHaveLength(1);
  });

  it('resgate subtrai do saldo', async () => {
    const goal = await createGoal(ownerId, novoObjetivo);
    await addGoalMovement(ownerId, goal.id, {
      type: 'DEPOSIT',
      amount: 1000,
      date: '2026-08-10',
    });

    const updated = await addGoalMovement(ownerId, goal.id, {
      type: 'WITHDRAWAL',
      amount: 400,
      date: '2026-08-15',
    });

    expect(updated.balance).toBe(600);
    expect(updated.movements).toHaveLength(2);
  });

  it('marca como concluído ao atingir a meta', async () => {
    const goal = await createGoal(ownerId, novoObjetivo);

    const updated = await addGoalMovement(ownerId, goal.id, {
      type: 'DEPOSIT',
      amount: 5000,
      date: '2026-08-10',
    });

    expect(updated).toMatchObject({
      completed: true,
      remaining: 0,
      usagePercent: 100,
    });
  });

  it('recusa resgate maior que o saldo, sem gravar nada', async () => {
    const goal = await createGoal(ownerId, novoObjetivo);
    await addGoalMovement(ownerId, goal.id, {
      type: 'DEPOSIT',
      amount: 300,
      date: '2026-08-10',
    });

    await expect(
      addGoalMovement(ownerId, goal.id, {
        type: 'WITHDRAWAL',
        amount: 500,
        date: '2026-08-11',
      }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

    // o saldo e o histórico continuam intactos
    const [atual] = await listGoals(ownerId);
    expect(atual.balance).toBe(300);
    expect(atual.movements).toHaveLength(1);
  });
});

describe('efeito no saldo do dashboard', () => {
  it('desconta o que foi separado no período e devolve o que foi resgatado', async () => {
    await db.variableIncome.create({
      data: {
        userId: ownerId,
        categoryId,
        title: 'Receita do teste',
        estimatedAmount: 1000,
        actualAmount: 1000,
        month: '2026-08',
        isReceived: true,
      },
    });
    await db.variableExpense.create({
      data: {
        userId: ownerId,
        categoryId,
        title: 'Despesa do teste',
        estimatedAmount: 200,
        actualAmount: 200,
        month: '2026-08',
        isPaid: true,
      },
    });

    const goal = await createGoal(ownerId, novoObjetivo);
    await addGoalMovement(ownerId, goal.id, {
      type: 'DEPOSIT',
      amount: 300,
      date: '2026-08-10',
    });
    await addGoalMovement(ownerId, goal.id, {
      type: 'WITHDRAWAL',
      amount: 50,
      date: '2026-08-20',
    });

    const summary = await getDashboardSummary(ownerId, { year: 2026, month: 8 });

    // 1000 de receita − 200 de despesa − (300 guardados − 50 resgatados)
    expect(summary.balance).toBe(550);
    expect(summary.goals.periodNet).toBe(250);
    expect(summary.goals.totalSaved).toBe(250);
    expect(summary.goals.items).toHaveLength(1);
    expect(summary.goals.items[0]).toMatchObject({ name: 'Viagem', balance: 250 });
  });

  it('ignora movimentações fora do período consultado', async () => {
    const goal = await createGoal(ownerId, novoObjetivo);
    await addGoalMovement(ownerId, goal.id, {
      type: 'DEPOSIT',
      amount: 400,
      date: '2026-07-10',
    });

    const agosto = await getDashboardSummary(ownerId, { year: 2026, month: 8 });

    // o aporte foi em julho: não afeta o saldo de agosto...
    expect(agosto.goals.periodNet).toBe(0);
    expect(agosto.balance).toBe(0);
    // ...mas o total guardado é acumulado, não do período
    expect(agosto.goals.totalSaved).toBe(400);
  });
});
