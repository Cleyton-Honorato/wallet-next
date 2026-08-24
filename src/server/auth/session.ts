import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIES } from '@/lib/constants';
import {
  SESSION_MAX_AGE_SECONDS,
  signSessionToken,
  verifySessionToken,
  type SessionPayload,
} from '@/server/auth/jwt';

export type SessionUser = SessionPayload;

export async function createSession(user: SessionUser): Promise<void> {
  const token = await signSessionToken(user);
  (await cookies()).set(COOKIES.SESSION, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIES.SESSION);
}

/** Sessão atual, ou null. Não redireciona — use em código que tolera anônimo. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIES.SESSION)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Sessão obrigatória. É a autoridade real do guard — o middleware é apenas
 * uma checagem otimista para a navegação.
 *
 * Toda leitura e toda mutação obtém o `userId` daqui: nenhuma action aceita
 * userId vindo do client, o que torna um IDOR impossível por construção.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return user;
}
