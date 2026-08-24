import type { InputHTMLAttributes, Ref } from 'react';
import { cn } from '@/lib/cn';
import styles from './Input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
  wrapperClassName?: string;
  /** React 19: a ref chega como prop comum — usada pelo register() do RHF. */
  ref?: Ref<HTMLInputElement>;
}

export function Input({
  label,
  id,
  error,
  className,
  wrapperClassName,
  ...props
}: InputProps) {
  return (
    <div className={cn(styles.wrapper, error && styles.error, wrapperClassName)}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input id={id} className={cn(styles.input, className)} {...props} />
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
}
