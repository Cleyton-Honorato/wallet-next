'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from '@/features/auth/schemas';
import { forgotPasswordAction } from '@/server/actions/auth';
import styles from './AuthPage.module.css';

export function ForgotPasswordForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await forgotPasswordAction(values);
    if (!result.ok) {
      setFormError(result.error);
      setMessage(null);
      setResetToken(null);
      return;
    }
    setMessage(result.data.message);
    setResetToken(result.data.resetToken ?? null);
  });

  const handleCopy = async () => {
    if (!resetToken) return;
    await navigator.clipboard.writeText(resetToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        {formError && <div className={styles.formError}>{formError}</div>}
        {message && <div className={styles.success}>{message}</div>}

        {resetToken && (
          <div className={styles.tokenBox}>
            <span className={styles.tokenLabel}>
              Seu código de redefinição (válido por 1 hora):
            </span>
            <code className={styles.tokenValue}>{resetToken}</code>
            <button
              type="button"
              className={styles.copyButton}
              onClick={handleCopy}
            >
              {copied ? 'Copiado!' : 'Copiar código'}
            </button>
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            className={styles.input}
            autoComplete="email"
            {...register('email')}
          />
          {errors.email && (
            <span className={styles.fieldError}>{errors.email.message}</span>
          )}
        </div>

        <button type="submit" className={styles.submit} disabled={isSubmitting}>
          {isSubmitting ? 'Gerando código…' : 'Gerar código'}
        </button>
      </form>

      {resetToken && (
        <p className={styles.switch}>
          <Link href={`/reset-password?token=${encodeURIComponent(resetToken)}`}>
            Redefinir senha agora
          </Link>
        </p>
      )}
    </>
  );
}
