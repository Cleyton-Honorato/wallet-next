import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from '@/server/db';
import { DomainError } from '@/server/errors';
import {
  assertCategoryUsable,
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from './categories';

/**
 * Testes de integração contra o Postgres de desenvolvimento — as regras que
 * protegem os dados só valem se o banco real as sustentar.
 * Requer `docker compose up -d` no wallet-api.
 */

let ownerId: number;
let intruderId: number;
let ownedCategoryId: number;
let systemCategoryId: number;

beforeAll(async () => {
  const owner = await db.user.upsert({
    where: { email: 'vitest-owner@wallet.test' },
    update: {},
    create: {
      name: 'Dono',
      email: 'vitest-owner@wallet.test',
      passwordHash: 'x',
    },
  });
  const intruder = await db.user.upsert({
    where: { email: 'vitest-intruder@wallet.test' },
    update: {},
    create: {
      name: 'Intruso',
      email: 'vitest-intruder@wallet.test',
      passwordHash: 'x',
    },
  });
  ownerId = owner.id;
  intruderId = intruder.id;

  const systemCategory = await db.category.findFirst({
    where: { userId: null, type: 'EXPENSE' },
  });
  if (!systemCategory) {
    throw new Error('rode `npm run db:seed` antes: falta categoria de sistema');
  }
  systemCategoryId = systemCategory.id;

  const created = await createCategory(ownerId, {
    name: 'Categoria do Dono',
    color: '#123456',
    type: 'EXPENSE',
  });
  ownedCategoryId = created.id;
});

afterAll(async () => {
  await db.category.deleteMany({
    where: { userId: { in: [ownerId, intruderId] } },
  });
  await db.user.deleteMany({ where: { id: { in: [ownerId, intruderId] } } });
  await db.$disconnect();
});

describe('escopo por usuário', () => {
  it('lista as categorias do usuário junto com as globais do sistema', async () => {
    const categories = await listCategories(ownerId);

    expect(categories.some((c) => c.id === ownedCategoryId)).toBe(true);
    expect(categories.some((c) => c.id === systemCategoryId)).toBe(true);
    expect(categories.every((c) => c.name !== 'Categoria Alheia')).toBe(true);
  });

  it('não deixa um usuário editar categoria de outro', async () => {
    await expect(
      updateCategory(intruderId, ownedCategoryId, { name: 'Invadida' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('não deixa um usuário excluir categoria de outro', async () => {
    await expect(
      deleteCategory(intruderId, ownedCategoryId),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it('responde "não encontrada" em vez de "proibido", para não revelar existência', async () => {
    await expect(
      updateCategory(intruderId, ownedCategoryId, { name: 'x' }),
    ).rejects.toMatchObject({ message: 'Categoria não encontrada' });
  });
});

describe('categorias do sistema', () => {
  it('não podem ser editadas', async () => {
    await expect(
      updateCategory(ownerId, systemCategoryId, { name: 'Renomeada' }),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it('não podem ser excluídas', async () => {
    await expect(
      deleteCategory(ownerId, systemCategoryId),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it('continuam utilizáveis como categoria de um lançamento', async () => {
    await expect(
      assertCategoryUsable(ownerId, systemCategoryId, 'EXPENSE'),
    ).resolves.toBeUndefined();
  });
});

describe('assertCategoryUsable', () => {
  it('rejeita categoria de outro usuário', async () => {
    await expect(
      assertCategoryUsable(intruderId, ownedCategoryId),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('rejeita categoria do tipo errado', async () => {
    await expect(
      assertCategoryUsable(ownerId, ownedCategoryId, 'INCOME'),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });
});

describe('nome duplicado', () => {
  it('vira conflito, não erro genérico', async () => {
    await expect(
      createCategory(ownerId, {
        name: 'Categoria do Dono',
        color: '#654321',
        type: 'EXPENSE',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });
});
