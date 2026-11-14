/**
 * Zera os dados financeiros de UM usuário, mantendo a conta (login e senha)
 * e as categorias padrão do sistema — ele volta a ser como um cadastro novo.
 *
 *   npm run db:reset-user -- --email pessoa@exemplo.com            # prévia
 *   npm run db:reset-user -- --email pessoa@exemplo.com --confirm  # apaga
 *
 * Sem --confirm nada é apagado: só mostra quem foi encontrado e quantos
 * registros sairiam. Com --confirm:
 *   1. grava um backup JSON de tudo do usuário em backups/ (fora do git);
 *   2. apaga tudo numa única transação — se algo falhar, nada é apagado.
 *
 * O banco é o do DATABASE_URL. Para produção, rode com a URL do Neon na frente
 * (ver README). Nunca apaga a linha em `users`.
 */
import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const email = readArg('--email')?.trim().toLowerCase();
const search = readArg('--search')?.trim();
const confirm = process.argv.includes('--confirm');

if (!email && !search) {
  console.error(
    'Uso:\n' +
      '  npm run db:reset-user -- --search cleyton                       # acha o e-mail (só lista)\n' +
      '  npm run db:reset-user -- --email pessoa@exemplo.com [--confirm]',
  );
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL não definida.');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

/** Host do banco, para a pessoa ver ONDE vai apagar — sem usuário nem senha. */
function describeDatabase(connection: string): string {
  try {
    const parsed = new URL(connection);
    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return '(URL não reconhecida)';
  }
}

/** Só leitura: lista quem casa com o termo, para descobrir o e-mail certo. */
async function searchUsers(term: string) {
  console.log(`\nBanco: ${describeDatabase(url!)}`);
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ],
    },
    select: { id: true, name: true, email: true },
    orderBy: { id: 'asc' },
    take: 20,
  });
  if (users.length === 0) {
    console.log(`Ninguém com "${term}" no nome ou no e-mail.\n`);
    return;
  }
  for (const u of users) console.log(`  id ${u.id}  ${u.name} <${u.email}>`);
  console.log('');
}

async function main() {
  if (search && !email) return searchUsers(search);

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: { id: true, name: true, email: true },
  });

  console.log(`\nBanco: ${describeDatabase(url!)}`);

  if (!user) {
    console.error(`Nenhum usuário com o e-mail "${email}".`);
    process.exitCode = 1;
    return;
  }

  console.log(`Usuário: ${user.name} <${user.email}> (id ${user.id})\n`);

  const userId = user.id;

  // Tudo que é do usuário, já com os filhos (quitações, tags, movimentações),
  // para o backup permitir reconstruir o que for preciso.
  const [
    fixedExpenses,
    fixedIncomes,
    variableExpenses,
    variableIncomes,
    budgets,
    emergencyFund,
    investments,
    goals,
    categories,
  ] = await Promise.all([
    prisma.fixedExpense.findMany({ where: { userId }, include: { settlements: true } }),
    prisma.fixedIncome.findMany({ where: { userId }, include: { settlements: true } }),
    prisma.variableExpense.findMany({ where: { userId }, include: { tags: true } }),
    prisma.variableIncome.findMany({ where: { userId }, include: { tags: true } }),
    prisma.monthlyBudget.findMany({ where: { userId }, include: { lines: true } }),
    prisma.emergencyFund.findUnique({ where: { userId }, include: { movements: true } }),
    prisma.investmentPosition.findMany({ where: { userId }, include: { movements: true } }),
    prisma.goal.findMany({ where: { userId }, include: { movements: true } }),
    prisma.category.findMany({ where: { userId } }),
  ]);

  const summary: [string, number][] = [
    ['Despesas fixas', fixedExpenses.length],
    ['Receitas fixas', fixedIncomes.length],
    ['Despesas variáveis', variableExpenses.length],
    ['Receitas variáveis', variableIncomes.length],
    ['Meses com limites de gasto', budgets.length],
    ['Movimentações da reserva', emergencyFund?.movements.length ?? 0],
    ['Investimentos', investments.length],
    ['Metas', goals.length],
    ['Categorias pessoais', categories.length],
  ];

  for (const [label, count] of summary) {
    console.log(`  ${label.padEnd(28)} ${count}`);
  }
  if (emergencyFund) {
    console.log(`  ${'Saldo da reserva'.padEnd(28)} R$ ${emergencyFund.balance.toString()}`);
  }

  if (!confirm) {
    console.log('\nPRÉVIA — nada foi apagado. Para apagar, rode de novo com --confirm.\n');
    return;
  }

  // 1. Backup antes de qualquer remoção.
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = path.join(process.cwd(), 'backups', 'user-resets');
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `user-${userId}-${stamp}.json`);
  writeFileSync(
    file,
    JSON.stringify(
      {
        database: describeDatabase(url!),
        user,
        exportedAt: new Date().toISOString(),
        fixedExpenses,
        fixedIncomes,
        variableExpenses,
        variableIncomes,
        budgets,
        emergencyFund,
        investments,
        goals,
        categories,
      },
      null,
      2,
    ),
  );
  console.log(`\nBackup salvo em ${path.relative(process.cwd(), file)}`);

  // 2. Remoção atômica. Lançamentos e limites antes das categorias: a FK de
  //    categoria não tem cascade e barraria a remoção. Quitações, tags e
  //    movimentações saem por cascade junto com o pai.
  await prisma.$transaction([
    prisma.fixedExpense.deleteMany({ where: { userId } }),
    prisma.fixedIncome.deleteMany({ where: { userId } }),
    prisma.variableExpense.deleteMany({ where: { userId } }),
    prisma.variableIncome.deleteMany({ where: { userId } }),
    prisma.monthlyBudget.deleteMany({ where: { userId } }),
    prisma.emergencyFund.deleteMany({ where: { userId } }),
    prisma.investmentPosition.deleteMany({ where: { userId } }),
    prisma.goal.deleteMany({ where: { userId } }),
    prisma.category.deleteMany({ where: { userId } }),
  ]);

  console.log(`Pronto: dados de ${user.name} apagados. A conta continua ativa.\n`);
}

main()
  .catch((error) => {
    console.error('Falhou — nada foi apagado (a remoção é uma transação única).');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
