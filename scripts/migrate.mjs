#!/usr/bin/env node
/**
 * Aplica as migrations pendentes do Prisma — o equivalente ao
 * `migrationsRun: true` do backend da Academe, adaptado à Vercel.
 *
 * Lá o servidor sobe uma vez e migra antes de atender. Aqui não existe
 * "subir o servidor": são funções serverless que acordam várias vezes, em
 * paralelo, e nem levam o CLI do Prisma no pacote. Por isso a migração roda
 * em dois momentos:
 *
 *   - `npm run dev`  → `predev`, antes do servidor local subir;
 *   - deploy Vercel  → `vercel-build`, antes do `next build`. Se a migration
 *     falhar, o build falha e a versão anterior continua no ar.
 *
 * Regras de segurança:
 *   - Só `migrate deploy`: aplica o que está pendente, nunca reseta nem apaga.
 *     O banco tem dados reais — `migrate reset`/`db push` não entram aqui.
 *   - Na Vercel, só no ambiente de produção. Previews usam as mesmas
 *     variáveis e migrariam o banco de produção com código de uma branch.
 *   - Usa a conexão direta do Neon quando disponível: o pooler (PgBouncer)
 *     não segura o advisory lock que o Prisma usa durante a migração.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const onVercel = Boolean(process.env.VERCEL);
const vercelEnv = process.env.VERCEL_ENV;

if (onVercel && vercelEnv !== 'production') {
  console.log(`[migrate] ambiente "${vercelEnv}" — migrations só rodam no deploy de produção. Pulando.`);
  process.exit(0);
}

// Conexão direta primeiro (nome usado pela integração Neon ↔ Vercel), depois
// um nome manual, e por fim a URL normal.
const url =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.DIRECT_DATABASE_URL ||
  process.env.DATABASE_URL;

if (onVercel && !url) {
  console.error('[migrate] nenhuma URL de banco definida (DATABASE_URL_UNPOOLED / DIRECT_DATABASE_URL / DATABASE_URL).');
  process.exit(1);
}

if (url && /-pooler\./.test(url)) {
  console.warn(
    '[migrate] aviso: a URL aponta para o pooler do Neon. Defina DATABASE_URL_UNPOOLED ' +
      '(ou DIRECT_DATABASE_URL) com a conexão direta se a migração travar.',
  );
}

const bin = path.join(
  process.cwd(),
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'prisma.cmd' : 'prisma',
);
const command = existsSync(bin) ? bin : 'npx';
const args = command === 'npx' ? ['prisma', 'migrate', 'deploy'] : ['migrate', 'deploy'];

console.log(`[migrate] aplicando migrations pendentes${onVercel ? ' (produção)' : ''}…`);

// Localmente, sem `url` aqui, o prisma.config.ts carrega o .env sozinho.
const env = url ? { ...process.env, DATABASE_URL: url } : process.env;
const result = spawnSync(command, args, { stdio: 'inherit', env });

if (result.error) {
  console.error('[migrate] não consegui executar o Prisma:', result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
