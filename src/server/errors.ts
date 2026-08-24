import 'server-only';
import { Prisma } from '@prisma-app/client';

export type DomainErrorCode =
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'BAD_REQUEST'
  | 'FORBIDDEN'
  | 'UNAUTHENTICATED';

/** Erro de domínio — substitui as HttpException do Nest. */
export class DomainError extends Error {
  constructor(
    readonly code: DomainErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

/** Recurso inexistente — também usado para itens de outro usuário, para não vazar existência. */
export class NotFoundError extends DomainError {
  constructor(message: string) {
    super('NOT_FOUND', message);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super('CONFLICT', message);
  }
}

export class BadRequestError extends DomainError {
  constructor(message: string) {
    super('BAD_REQUEST', message);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string) {
    super('FORBIDDEN', message);
  }
}

export class UnauthenticatedError extends DomainError {
  constructor(message = 'Sessão expirada') {
    super('UNAUTHENTICATED', message);
  }
}

/** True quando o erro é violação de unique constraint (P2002). */
export function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

/** True quando o registro alvo não foi encontrado (P2025). */
export function isRecordNotFoundError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2025'
  );
}
