'use server';

import {
  createCategorySchema,
  deleteCategorySchema,
  updateCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from '@/features/categories/schemas';
import { authAction } from '@/server/actions/_helpers';
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from '@/server/services/categories';
import type { ActionResult } from '@/lib/result';
import type { CategoryDto } from '@/lib/types';

/** Categoria aparece em toda tela que classifica lançamentos. */
const REVALIDATE = [
  '/categories',
  '/',
  '/expenses/fixed',
  '/expenses/variable',
  '/incomes/fixed',
  '/incomes/variable',
] as const;

export async function createCategoryAction(
  input: CreateCategoryInput,
): Promise<ActionResult<CategoryDto>> {
  return authAction({
    schema: createCategorySchema,
    input,
    revalidate: REVALIDATE,
    handler: (data, user) => createCategory(user.userId, data),
  });
}

export async function updateCategoryAction(
  input: UpdateCategoryInput,
): Promise<ActionResult<CategoryDto>> {
  return authAction({
    schema: updateCategorySchema,
    input,
    revalidate: REVALIDATE,
    handler: ({ id, ...data }, user) => updateCategory(user.userId, id, data),
  });
}

export async function deleteCategoryAction(
  input: { id: number },
): Promise<ActionResult<void>> {
  return authAction({
    schema: deleteCategorySchema,
    input,
    revalidate: REVALIDATE,
    handler: ({ id }, user) => deleteCategory(user.userId, id),
  });
}
