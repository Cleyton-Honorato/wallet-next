import 'server-only';
import type { Category } from '@prisma-app/client';
import { db } from '@/server/db';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  isUniqueConstraintError,
} from '@/server/errors';
import type { CategoryDto, CategoryType } from '@/lib/types';

function toResponse(category: Category): CategoryDto {
  return {
    id: category.id,
    name: category.name,
    color: category.color,
    icon: category.icon,
    type: category.type,
    isSystem: category.isSystem,
  };
}

/** Categorias do usuário + as globais do sistema (userId NULL). */
export async function listCategories(userId: number): Promise<CategoryDto[]> {
  const categories = await db.category.findMany({
    where: { OR: [{ userId }, { userId: null }] },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  });
  return categories.map(toResponse);
}

export async function createCategory(
  userId: number,
  input: { name: string; color: string; icon?: string; type: CategoryType },
): Promise<CategoryDto> {
  try {
    const category = await db.category.create({
      data: { ...input, userId, isSystem: false },
    });
    return toResponse(category);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ConflictError('Já existe uma categoria com esse nome e tipo');
    }
    throw error;
  }
}

export async function updateCategory(
  userId: number,
  id: number,
  input: { name?: string; color?: string; icon?: string; type?: CategoryType },
): Promise<CategoryDto> {
  await assertOwnedAndEditable(userId, id);
  try {
    const category = await db.category.update({ where: { id }, data: input });
    return toResponse(category);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ConflictError('Já existe uma categoria com esse nome e tipo');
    }
    throw error;
  }
}

export async function deleteCategory(
  userId: number,
  id: number,
): Promise<void> {
  await assertOwnedAndEditable(userId, id);
  await db.category.delete({ where: { id } });
}

/**
 * Valida, para uso como FK em receitas/despesas/orçamentos, que a categoria
 * existe e é utilizável pelo usuário (própria ou global do sistema).
 */
export async function assertCategoryUsable(
  userId: number,
  categoryId: number,
  type?: CategoryType,
): Promise<void> {
  const category = await db.category.findUnique({ where: { id: categoryId } });
  if (!category || (category.userId !== userId && category.userId !== null)) {
    throw new NotFoundError('Categoria não encontrada');
  }
  if (type && category.type !== type) {
    throw new BadRequestError(`A categoria deve ser do tipo ${type}`);
  }
}

/**
 * Garante que a categoria existe, é do usuário e não é do sistema.
 * Categorias globais têm `userId` nulo e por isso caem no "não encontrada" —
 * mesma resposta de um id de outro usuário, para não revelar existência.
 */
async function assertOwnedAndEditable(
  userId: number,
  id: number,
): Promise<Category> {
  const category = await db.category.findUnique({ where: { id } });
  if (!category || category.userId !== userId) {
    throw new NotFoundError('Categoria não encontrada');
  }
  if (category.isSystem) {
    throw new ForbiddenError('Categorias do sistema não podem ser alteradas');
  }
  return category;
}
