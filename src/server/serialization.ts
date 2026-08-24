import 'server-only';
import { Prisma } from '@prisma-app/client';

/**
 * Converte Decimal (Prisma) → number para a fronteira RSC → client.
 * Objetos Decimal não são serializáveis como props; todo DTO passa por aqui.
 */
export function toNumber(value: Prisma.Decimal): number;
export function toNumber(value: Prisma.Decimal | null): number | null;
export function toNumber(value: Prisma.Decimal | null): number | null {
  return value === null ? null : value.toNumber();
}

/** Converte Date → string ISO (ou null). */
export function toIso(value: Date): string;
export function toIso(value: Date | null): string | null;
export function toIso(value: Date | null): string | null {
  return value === null ? null : value.toISOString();
}

/** Converte um Date que representa só a data (`@db.Date`) → 'YYYY-MM-DD'. */
export function toDateOnly(value: Date): string;
export function toDateOnly(value: Date | null): string | null;
export function toDateOnly(value: Date | null): string | null {
  return value === null ? null : value.toISOString().slice(0, 10);
}
