import { clsx, type ClassValue } from 'clsx';

/** Junta class names condicionalmente. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
