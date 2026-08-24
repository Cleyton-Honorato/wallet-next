import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export const metadata: Metadata = { title: 'Criar conta — Wallet' };

export default function RegisterPage() {
  return (
    <AuthCard
      subtitle="Crie sua conta"
      footer={
        <>
          Já tem conta? <Link href="/login">Entrar</Link>
        </>
      }
    >
      <Suspense>
        <RegisterForm />
      </Suspense>
    </AuthCard>
  );
}
