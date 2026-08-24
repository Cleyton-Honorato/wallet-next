'use client';

import { useEffect } from 'react';

/**
 * Fecha no Escape e trava a rolagem do fundo enquanto o diálogo está aberto.
 * Separado do `Modal` para que diálogos com layout próprio (reserva de
 * emergência) reusem o comportamento sem herdar as classes do modal padrão.
 */
export function useModalBehavior(onClose: () => void): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);
}
