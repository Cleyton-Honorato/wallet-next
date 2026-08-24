'use client';

import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { useModalBehavior } from './useModalBehavior';
import styles from './Modal.module.css';

interface ModalShellProps {
  /** Rótulo acessível do diálogo — id de um elemento dentro do conteúdo. */
  labelledBy: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

/**
 * Overlay + fechamento por Escape/clique fora + trava de rolagem.
 * Não impõe estrutura interna: use `Modal` para o layout padrão.
 */
export function ModalShell({
  labelledBy,
  onClose,
  children,
  className,
}: ModalShellProps) {
  useModalBehavior(onClose);

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={cn(styles.modal, className)}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
      >
        {children}
      </div>
    </div>
  );
}

interface ModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
}: ModalProps) {
  const titleId = useId();

  return (
    <ModalShell
      labelledBy={titleId}
      onClose={onClose}
      className={cn(wide && styles.modalWide)}
    >
      <h3 id={titleId} className={styles.title}>
        {title}
      </h3>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      {children}
    </ModalShell>
  );
}

export { styles as modalStyles };
