'use client';

import { useEffect, useRef } from 'react';
import { lockScroll } from '@/lib/scroll-lock';

/**
 * Fecha no Escape e trava a rolagem do fundo enquanto o diálogo está aberto
 * (no iPhone também — ver `lockScroll`). Separado do `Modal` para que
 * diálogos com layout próprio (reserva de emergência) reusem o comportamento.
 *
 * O `onClose` fica numa ref: quem chama costuma passar uma função nova a cada
 * render, e isso não pode destravar e travar a página de novo a cada vez.
 */
export function useModalBehavior(onClose: () => void): void {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    const unlock = lockScroll();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      unlock();
    };
  }, []);
}
