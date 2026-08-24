import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import { COOKIES } from '@/lib/constants';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Wallet — Finanças Pessoais',
  description: 'Controle financeiro pessoal: despesas, receitas e orçamento.',
};

export const viewport: Viewport = {
  themeColor: '#0c0d12',
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Tema resolvido no servidor: evita o flash de tema errado na primeira pintura.
  const theme = (await cookies()).get(COOKIES.THEME)?.value === 'light' ? 'light' : 'dark';

  return (
    <html lang="pt-BR" data-theme={theme} className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
