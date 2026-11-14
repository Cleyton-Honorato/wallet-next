'use server';

import { z } from 'zod';
import { authAction } from '@/server/actions/_helpers';
import { settleAllOverdue } from '@/server/services/overdue';
import type { ActionResult } from '@/lib/result';

/**
 * Quitação em massa das contas vencidas. Não recebe a lista do client de
 * propósito: o serviço recalcula o que está vencido a partir da sessão, então
 * nada além do que é realmente devido pelo usuário pode ser quitado.
 */
export async function settleAllOverdueAction(): Promise<
  ActionResult<{ settled: number }>
> {
  return authAction({
    schema: z.object({}).strict(),
    input: {},
    revalidate: ['/', '/transactions'],
    handler: (_data, user) => settleAllOverdue(user.userId),
  });
}
