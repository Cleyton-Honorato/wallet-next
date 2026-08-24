import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';

export const metadata: Metadata = { title: 'Redefinir senha — Wallet' };

export default function ResetPasswordPage() {
  return (
    <AuthCard
      subtitle="Defina uma nova senha"
      footer={
        <>
          <Link href="/forgot-password">Gerar novo código</Link>
          {' · '}
          <Link href="/login">Voltar ao login</Link>
        </>
      }
    >
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
