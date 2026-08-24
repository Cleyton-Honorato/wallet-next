import { z } from 'zod';
import { amountSchema, dateOnlySchema, optionalAmountSchema } from '@/lib/validation';

export const updateEmergencyFundSchema = z
  .object({
    targetAmount: optionalAmountSchema,
    balance: optionalAmountSchema.optional(),
  })
  .strict();

export const createEmergencyFundMovementSchema = z
  .object({
    type: z.enum(['DEPOSIT', 'WITHDRAWAL']),
    amount: amountSchema,
    date: dateOnlySchema,
    description: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .or(z.literal('').transform(() => undefined)),
  })
  .strict();

export type UpdateEmergencyFundInput = z.infer<
  typeof updateEmergencyFundSchema
>;
export type CreateEmergencyFundMovementInput = z.infer<
  typeof createEmergencyFundMovementSchema
>;
