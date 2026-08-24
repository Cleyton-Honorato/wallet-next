import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { LoginForm } from '@/features/auth/components/LoginForm';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Entrar — Wallet' };

export default function LoginPage() {
  return (
    <AuthCard
      subtitle="Entre na sua conta"
      footer={
        <>
          Não tem conta? <Link href="/register">Criar conta</Link>
        </>
      }
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
