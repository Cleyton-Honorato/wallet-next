import type { MetadataRoute } from 'next';

/**
 * Manifest do PWA — servido pelo Next em /manifest.webmanifest e linkado no
 * <head> automaticamente. É o que permite "Adicionar à tela inicial" e abrir
 * o Wallet em tela cheia, sem a barra do navegador.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Wallet — Finanças Pessoais',
    short_name: 'Wallet',
    description: 'Anote seus gastos em segundos e saiba quanto sobra no mês.',
    lang: 'pt-BR',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f2f3ef',
    theme_color: '#f2f3ef',
    categories: ['finance', 'productivity'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    // Atalhos no toque longo do ícone (Android / desktop).
    shortcuts: [
      {
        name: 'Lançamentos',
        short_name: 'Lançamentos',
        url: '/transactions',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Metas',
        short_name: 'Metas',
        url: '/goals',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}
