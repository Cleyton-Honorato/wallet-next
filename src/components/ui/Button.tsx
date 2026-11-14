import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  /** Ocupa a largura toda — padrão das ações principais no celular. */
  block?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  block = false,
  type = 'button',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        styles.button,
        styles[variant],
        styles[size],
        block && styles.block,
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
