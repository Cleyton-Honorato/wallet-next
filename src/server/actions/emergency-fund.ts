'use server';

import {
  createEmergencyFundMovementSchema,
  updateEmergencyFundSchema,
  type CreateEmergencyFundMovementInput,
  type UpdateEmergencyFundInput,
} from '@/features/emergency-fund/schemas';
import { authAction } from '@/server/actions/_helpers';
import {
  addEmergencyFundMovement,
  updateEmergencyFund,
} from '@/server/services/emergency-fund';
import type { ActionResult } from '@/lib/result';
import type { EmergencyFundDto } from '@/lib/types';

/** A reserva só aparece no dashboard. */
const REVALIDATE = ['/'] as const;

export async function updateEmergencyFundAction(
  input: UpdateEmergencyFundInput,
): Promise<ActionResult<EmergencyFundDto>> {
  return authAction({
    schema: updateEmergencyFundSchema,
    input,
    revalidate: REVALIDATE,
    handler: (data, user) => updateEmergencyFund(user.userId, data),
  });
}

export async function addEmergencyFundMovementAction(
  input: CreateEmergencyFundMovementInput,
): Promise<ActionResult<EmergencyFundDto>> {
  return authAction({
    schema: createEmergencyFundMovementSchema,
    input,
    revalidate: REVALIDATE,
    handler: (data, user) => addEmergencyFundMovement(user.userId, data),
  });
}
