import 'server-only';
import type { Goal, GoalMovement } from '@prisma-app/client';
import { db } from '@/server/db';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  isUniqueConstraintError,
} from '@/server/errors';
import { toDateOnly, toNumber } from '@/server/serialization';
import { getBudgetUsagePercent, getRemaining } from '@/lib/budget';
import type { GoalDto, GoalMovementType } from '@/lib/types';

type GoalWithMovements = Goal & { movements: GoalMovement[] };

/** Movimentações sempre da mais recente para a mais antiga. */
const movementsOrder = { orderBy: { date: 'desc' } } as const;

function toResponse(goal: GoalWithMovements): GoalDto {
  const balance = toNumber(goal.balance);
  const targetAmount = toNumber(goal.targetAmount);

  return {
    id: goal.id,
    name: goal.name,
    icon: goal.icon,
    color: goal.color,
    targetAmount,
    balance,
    remaining: getRemaining(targetAmount, balance),
    usagePercent: getBudgetUsagePercent(balance, targetAmount),
    completed: balance >= targetAmount,
    targetDate: toDateOnly(goal.targetDate),
    movements: goal.movements.map((m) => ({
      id: m.id,
      type: m.type,
      amount: toNumber(m.amount),
      date: toDateOnly(m.date),
      description: m.description,
    })),
  };
}

export async function listGoals(userId: number): Promise<GoalDto[]> {
  const goals = await db.goal.findMany({
    where: { userId },
    include: { movements: movementsOrder },
    orderBy: { createdAt: 'asc' },
  });
  return goals.map(toResponse);
}

export async function createGoal(
  userId: number,
  input: {
    name: string;
    icon?: string;
    color: string;
    targetAmount: number;
    targetDate?: string | null;
  },
): Promise<GoalDto> {
  try {
    const goal = await db.goal.create({
      data: {
        userId,
        name: input.name,
        icon: input.icon,
        color: input.color,
        targetAmount: input.targetAmount,
        targetDate: input.targetDate ? new Date(input.targetDate) : null,
      },
      include: { movements: movementsOrder },
    });
    return toResponse(goal);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ConflictError('Já existe uma meta com esse nome');
    }
    throw error;
  }
}

export async function updateGoal(
  userId: number,
  id: number,
  input: {
    name?: string;
    icon?: string;
    color?: string;
    targetAmount?: number;
    targetDate?: string | null;
  },
): Promise<GoalDto> {
  await assertOwned(userId, id);
  try {
    const goal = await db.goal.update({
      where: { id },
      data: {
        name: input.name,
        icon: input.icon,
        color: input.color,
        targetAmount: input.targetAmount,
        targetDate:
          input.targetDate === undefined
            ? undefined
            : input.targetDate
              ? new Date(input.targetDate)
              : null,
      },
      include: { movements: movementsOrder },
    });
    return toResponse(goal);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ConflictError('Já existe uma meta com esse nome');
    }
    throw error;
  }
}

/** Remove o objetivo; as movimentações vão junto (cascade). */
export async function deleteGoal(userId: number, id: number): Promise<void> {
  await assertOwned(userId, id);
  await db.goal.delete({ where: { id } });
}

/**
 * Registra aporte ou resgate e ajusta o saldo na mesma transação — mesma
 * mecânica da reserva de emergência, incluindo o piso de zero.
 */
export async function addGoalMovement(
  userId: number,
  id: number,
  input: {
    type: GoalMovementType;
    amount: number;
    date: string;
    description?: string | null;
  },
): Promise<GoalDto> {
  const goal = await assertOwned(userId, id);

  const delta = input.type === 'DEPOSIT' ? input.amount : -input.amount;
  const newBalance = toNumber(goal.balance) + delta;
  if (newBalance < 0) {
    throw new BadRequestError('Saldo insuficiente para o resgate');
  }

  const updated = await db.$transaction(async (tx) => {
    await tx.goalMovement.create({
      data: {
        goalId: goal.id,
        type: input.type,
        amount: input.amount,
        date: new Date(input.date),
        description: input.description,
      },
    });
    return tx.goal.update({
      where: { id: goal.id },
      data: { balance: newBalance },
      include: { movements: movementsOrder },
    });
  });

  return toResponse(updated);
}

/** 404 (não 403) para objetivo de outro usuário: não revela que ele existe. */
async function assertOwned(userId: number, id: number): Promise<Goal> {
  const goal = await db.goal.findUnique({ where: { id } });
  if (!goal || goal.userId !== userId) {
    throw new NotFoundError('Meta não encontrada');
  }
  return goal;
}
