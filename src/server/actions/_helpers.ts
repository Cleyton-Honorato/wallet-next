import 'server-only';
import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import type { ZodType, z } from 'zod';
import { DomainError } from '@/server/errors';
import { getSessionUser, type SessionUser } from '@/server/auth/session';
import { fail, ok, type ActionResult } from '@/lib/result';
import { toFieldErrors } from '@/lib/validation';

/**
 * Traduz uma exceção em `ActionResult`. Controle de fluxo do Next
 * (`redirect`/`notFound`) é relançado — engoli-lo aqui quebraria a navegação.
 */
function toFailure<T>(error: unknown): ActionResult<T> {
  unstable_rethrow(error);

  if (error instanceof DomainError) {
    return fail<T>(error.message, error.code);
  }

  console.error('[action] erro não tratado:', error);
  return fail<T>('Algo deu errado. Tente novamente.', 'UNKNOWN');
}

/**
 * Executa uma mutação autenticada: sessão → validação → regra → revalidação.
 *
 * O `userId` chega ao handler exclusivamente pela sessão, nunca pelo input —
 * é o que impede acesso a dados de outro usuário.
 */
export async function authAction<S extends ZodType, T>(options: {
  schema: S;
  input: unknown;
  handler: (data: z.infer<S>, user: SessionUser) => Promise<T>;
  revalidate?: readonly string[];
}): Promise<ActionResult<T>> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return fail<T>('Sessão expirada. Entre novamente.', 'UNAUTHENTICATED');
    }

    const parsed = options.schema.safeParse(options.input);
    if (!parsed.success) {
      return fail<T>(
        'Verifique os campos destacados.',
        'VALIDATION',
        toFieldErrors(parsed.error),
      );
    }

    const data = await options.handler(parsed.data, user);

    for (const path of options.revalidate ?? []) {
      revalidatePath(path);
    }

    return ok(data);
  } catch (error) {
    return toFailure<T>(error);
  }
}

/** Variante sem sessão — só para os fluxos de auth (login, registro, senha). */
export async function publicAction<S extends ZodType, T>(options: {
  schema: S;
  input: unknown;
  handler: (data: z.infer<S>) => Promise<T>;
}): Promise<ActionResult<T>> {
  try {
    const parsed = options.schema.safeParse(options.input);
    if (!parsed.success) {
      return fail<T>(
        'Verifique os campos destacados.',
        'VALIDATION',
        toFieldErrors(parsed.error),
      );
    }

    return ok(await options.handler(parsed.data));
  } catch (error) {
    return toFailure<T>(error);
  }
}
