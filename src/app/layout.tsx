import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Wallet — Finanças Pessoais',
  description: 'Anote seus gastos em segundos e saiba quanto sobra no mês.',
  applicationName: 'Wallet',
  // iOS: abre em tela cheia quando adicionado à tela de início.
  appleWebApp: {
    capable: true,
    title: 'Wallet',
    statusBarStyle: 'default',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#f1f3f5',
  // Deixa o conteúdo ir até as bordas no iPhone; os env(safe-area-inset-*)
  // do CSS cuidam do notch e da barra de gestos.
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={jakarta.variable}>
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
