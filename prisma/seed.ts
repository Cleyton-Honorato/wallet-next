import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/** Categorias globais do sistema (userId NULL, isSystem true). */
const SYSTEM_CATEGORIES = [
  { name: 'Moradia', color: '#4f6ef7', type: 'EXPENSE' as const },
  { name: 'Alimentação', color: '#22c55e', type: 'EXPENSE' as const },
  { name: 'Transporte', color: '#f59e0b', type: 'EXPENSE' as const },
  { name: 'Saúde', color: '#ef4444', type: 'EXPENSE' as const },
  { name: 'Lazer', color: '#8b5cf6', type: 'EXPENSE' as const },
  { name: 'Educação', color: '#06b6d4', type: 'EXPENSE' as const },
  { name: 'Contas', color: '#ec4899', type: 'EXPENSE' as const },
  { name: 'Salário', color: '#16a34a', type: 'INCOME' as const },
  { name: 'Freelance', color: '#3b82f6', type: 'INCOME' as const },
];

async function main() {
  // Usuário de teste
  const email = 'demo@wallet.com';
  const passwordHash = await bcrypt.hash('demo1234', 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { name: 'Demo', email, passwordHash },
  });
  console.log(`✔ Usuário seed: ${user.email} (senha: demo1234)`);

  // Categorias de sistema — userId NULL não cabe no unique (userId,name,type),
  // então verificamos manualmente para manter idempotência.
  for (const cat of SYSTEM_CATEGORIES) {
    const exists = await prisma.category.findFirst({
      where: { userId: null, name: cat.name, type: cat.type },
    });
    if (!exists) {
      await prisma.category.create({
        data: { ...cat, isSystem: true, userId: null },
      });
    }
  }
  console.log(`✔ ${SYSTEM_CATEGORIES.length} categorias de sistema garantidas`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
