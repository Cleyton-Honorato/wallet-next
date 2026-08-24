import { z } from 'zod';
import {
  amountSchema,
  dateOnlySchema,
  dayOfMonthSchema,
  idSchema,
  monthKeySchema,
} from '@/lib/validation';

export const entryKindSchema = z.enum(['expense', 'income']);

const titleSchema = z
  .string()
  .trim()
  .min(1, 'Informe o título')
  .max(120, 'Título deve ter no máximo 120 caracteres');

const descriptionSchema = z
  .string()
  .trim()
  .max(2000, 'Descrição muito longa')
  .optional()
  .or(z.literal('').transform(() => undefined));

/** Campos comuns às quatro telas de lançamento. */
export const fixedEntrySchema = z
  .object({
    categoryId: idSchema,
    title: titleSchema,
    amount: amountSchema,
    description: descriptionSchema,
    day: dayOfMonthSchema,
    isActive: z.boolean().optional(),
    startDate: dateOnlySchema,
    endDate: dateOnlySchema
      .nullish()
      .or(z.literal('').transform(() => null)),
  })
  .strict();

export const createFixedEntrySchema = fixedEntrySchema;

export const updateFixedEntrySchema = fixedEntrySchema
  .partial()
  .extend({ id: idSchema })
  .strict();

export const variableEntrySchema = z
  .object({
    categoryId: idSchema,
    title: titleSchema,
    estimatedAmount: amountSchema,
    actualAmount: amountSchema
      .nullish()
      .or(z.literal('').transform(() => null)),
    description: descriptionSchema,
    month: monthKeySchema,
    settled: z.boolean().optional(),
    tags: z.array(z.string().trim().min(1)).optional(),
  })
  .strict();

export const createVariableEntrySchema = variableEntrySchema;

export const updateVariableEntrySchema = variableEntrySchema
  .partial()
  .extend({ id: idSchema })
  .strict();

export const settleFixedEntrySchema = z
  .object({
    id: idSchema,
    month: monthKeySchema,
    settled: z.boolean(),
  })
  .strict();

export const bulkSettleVariableEntrySchema = z
  .object({
    categoryId: idSchema,
    month: monthKeySchema,
    settled: z.boolean(),
  })
  .strict();

export const deleteEntrySchema = z.object({ id: idSchema }).strict();

export type FixedEntryInput = z.infer<typeof fixedEntrySchema>;
export type UpdateFixedEntryInput = z.infer<typeof updateFixedEntrySchema>;
export type VariableEntryInput = z.infer<typeof variableEntrySchema>;
export type UpdateVariableEntryInput = z.infer<
  typeof updateVariableEntrySchema
>;
