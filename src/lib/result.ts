/** Retorno padronizado de toda server action. */

export type ActionErrorCode =
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'BAD_REQUEST'
  | 'FORBIDDEN'
  | 'UNAUTHENTICATED'
  | 'VALIDATION'
  | 'UNKNOWN';

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: string;
      code: ActionErrorCode;
      fieldErrors?: Record<string, string[]>;
    };

export function ok(): ActionResult<void>;
export function ok<T>(data: T): ActionResult<T>;
export function ok<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data };
}

export function fail<T = never>(
  error: string,
  code: ActionErrorCode = 'UNKNOWN',
  fieldErrors?: Record<string, string[]>,
): ActionResult<T> {
  return { ok: false, error, code, fieldErrors };
}
