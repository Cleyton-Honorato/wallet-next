import { z } from 'zod';
import { hexColorSchema, idSchema } from '@/lib/validation';

export const categoryTypeSchema = z.enum(['EXPENSE', 'INCOME']);

export const createCategorySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Informe o nome')
      .max(60, 'Nome deve ter no máximo 60 caracteres'),
    color: hexColorSchema,
    icon: z.string().max(60).optional(),
    type: categoryTypeSchema,
  })
  .strict();

export const updateCategorySchema = createCategorySchema
  .partial()
  .extend({ id: idSchema })
  .strict();

export const deleteCategorySchema = z.object({ id: idSchema }).strict();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
