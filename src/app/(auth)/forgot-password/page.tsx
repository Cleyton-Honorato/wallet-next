import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';

export const metadata: Metadata = { title: 'Recuperar senha — Wallet' };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      subtitle="Recuperar senha"
      footer={
        <>
          Lembrou a senha? <Link href="/login">Voltar ao login</Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
