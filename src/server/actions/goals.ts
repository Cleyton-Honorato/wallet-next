'use server';

import {
  createGoalSchema,
  deleteGoalSchema,
  goalMovementSchema,
  updateGoalSchema,
  type CreateGoalInput,
  type GoalMovementInput,
  type UpdateGoalInput,
} from '@/features/goals/schemas';
import { authAction } from '@/server/actions/_helpers';
import {
  addGoalMovement,
  createGoal,
  deleteGoal,
  updateGoal,
} from '@/server/services/goals';
import type { ActionResult } from '@/lib/result';
import type { GoalDto } from '@/lib/types';

/** O dashboard mostra o painel de objetivos e o saldo, que depende dos aportes. */
const REVALIDATE = ['/goals', '/'] as const;

export async function createGoalAction(
  input: CreateGoalInput,
): Promise<ActionResult<GoalDto>> {
  return authAction({
    schema: createGoalSchema,
    input,
    revalidate: REVALIDATE,
    handler: (data, user) => createGoal(user.userId, data),
  });
}

export async function updateGoalAction(
  input: UpdateGoalInput,
): Promise<ActionResult<GoalDto>> {
  return authAction({
    schema: updateGoalSchema,
    input,
    revalidate: REVALIDATE,
    handler: ({ id, ...data }, user) => updateGoal(user.userId, id, data),
  });
}

export async function deleteGoalAction(
  input: { id: number },
): Promise<ActionResult<void>> {
  return authAction({
    schema: deleteGoalSchema,
    input,
    revalidate: REVALIDATE,
    handler: ({ id }, user) => deleteGoal(user.userId, id),
  });
}

export async function addGoalMovementAction(
  input: GoalMovementInput,
): Promise<ActionResult<GoalDto>> {
  return authAction({
    schema: goalMovementSchema,
    input,
    revalidate: REVALIDATE,
    handler: ({ id, ...data }, user) => addGoalMovement(user.userId, id, data),
  });
}
