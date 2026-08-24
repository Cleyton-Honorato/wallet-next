# Wallet

Controle financeiro pessoal em Next.js (App Router), unificando o antigo
frontend `wallet` (React + Vite) e a API `wallet-api` (NestJS) num só projeto.

Leituras são feitas em Server Components chamando os services diretamente;
mutações são Server Actions. Não há camada REST interna.

## Requisitos

- Node 20+
- Docker (para o PostgreSQL)

## Rodando

O banco é o mesmo do `wallet-api` — os dados existentes são preservados.

```bash
docker compose -f ../wallet-api/docker-compose.yml up -d
```

```bash
npm install
```

```bash
npm run dev
```

Usuário de demonstração após `npm run db:seed`: `demo@wallet.com` / `demo1234`.

## Scripts

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento em http://localhost:3000 |
| `npm run build` / `npm start` | Build de produção e execução |
| `npm test` | Testes (Vitest) |
| `npm run lint` | ESLint |
| `npm run db:status` | Confere se as migrations do banco estão em dia |
| `npm run db:seed` | Cria o usuário demo e as categorias de sistema |
| `npm run db:studio` | Prisma Studio |

> Nunca rode `prisma migrate reset` ou `db push`: o banco é compartilhado com o
> projeto antigo e contém dados reais.

## Estrutura

```
prisma/            schema, migrations e seed (cópia fiel do wallet-api)
src/
  proxy.ts         guard de rotas (o "middleware" do Next 16)
  app/             apenas roteamento — páginas finas
    (auth)/        login, cadastro e recuperação de senha
    (app)/         área autenticada: dashboard, lançamentos, categorias
  server/          código exclusivo de servidor (marcado com `server-only`)
    db.ts          cliente Prisma singleton
    auth/          sessão em cookie httpOnly (JWT via jose)
    services/      regras de negócio portadas do NestJS
    actions/       server actions ('use server')
  features/        UI por domínio + schemas Zod compartilhados client/servidor
  components/      componentes base e layout
  lib/             utilitários isomórficos (formatação, tipos, validação)
  styles/          design tokens e reset
```

### Convenções que sustentam a segurança

- O `userId` nasce **apenas** de `requireUser()`; nenhuma action o aceita do
  cliente. Todo service o exige como primeiro parâmetro.
- Todo arquivo em `src/server/` importa `server-only`: usá-lo a partir de um
  client component quebra o build em vez de vazar dados.
- Acesso a item de outro usuário responde "não encontrado" (404), não
  "proibido" — não revela que o registro existe.
- Services nunca devolvem objetos do Prisma: só DTOs planos, o que também
  resolve a serialização de `Decimal` e `Date` na fronteira servidor → cliente.

## Testes

`npm test` cobre:

- as regras de escopo por usuário e de categorias do sistema, contra o banco
  real (exige o Postgres no ar);
- os cálculos do dashboard (projeção de itens fixos, status das células da
  matriz anual), com fixtures puras.

A paridade com o backend NestJS foi verificada comparando `dashboard/summary`
(anual e mensal) e `dashboard/matrix` campo a campo, sobre o mesmo banco.
# wallet-next
