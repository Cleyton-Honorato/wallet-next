import { jwtVerify, SignJWT, type JWTPayload } from 'jose';

/**
 * Assinatura/verificação de JWT com `jose` — funciona tanto no runtime Node
 * (server actions) quanto no Edge (middleware).
 *
 * Este módulo é deliberadamente livre de `server-only`: o middleware precisa
 * dele. Ainda assim nunca chega ao bundle do client, pois só é importado por
 * código de servidor.
 */

const ALG = 'HS256';

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7d
const RESET_MAX_AGE_SECONDS = 60 * 60; // 1h

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET ?? 'change-me-in-production';
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  /** Id interno (Int) do usuário — escopo de toda query. */
  userId: number;
  email: string;
  name: string;
}

/** `sub` é string por exigência da spec do JWT; o id interno é numérico. */
export async function signSessionToken(
  payload: SessionPayload,
): Promise<string> {
  return new SignJWT({ email: payload.email, name: payload.name })
    .setProtectedHeader({ alg: ALG })
    .setSubject(String(payload.userId))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: [ALG],
    });
    return toSessionPayload(payload);
  } catch {
    return null;
  }
}

function toSessionPayload(payload: JWTPayload): SessionPayload | null {
  const userId = Number(payload.sub);
  const { email, name } = payload as { email?: unknown; name?: unknown };

  // Um token de reset de senha não carrega e-mail — rejeitá-lo aqui impede
  // que seja usado como sessão (mesma defesa da JwtStrategy anterior).
  if (!Number.isInteger(userId) || userId <= 0) return null;
  if (typeof email !== 'string' || typeof name !== 'string') return null;

  return { userId, email, name };
}

export async function signPasswordResetToken(userId: number): Promise<string> {
  return new SignJWT({ purpose: 'password_reset' })
    .setProtectedHeader({ alg: ALG })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${RESET_MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

/** Devolve o id do usuário se o token for um reset válido e não expirado. */
export async function verifyPasswordResetToken(
  token: string,
): Promise<number | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: [ALG],
    });
    if (payload.purpose !== 'password_reset') return null;
    const userId = Number(payload.sub);
    return Number.isInteger(userId) && userId > 0 ? userId : null;
  } catch {
    return null;
  }
}
