'use client';

import { useEffect } from 'react';

/**
 * Registra /sw.js. Só em produção: no `next dev` os arquivos de
 * /_next/static não têm hash estável e um cache-first serviria código velho.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .catch((error) => console.error('[pwa] falha ao registrar o service worker', error));
  }, []);

  return null;
}
