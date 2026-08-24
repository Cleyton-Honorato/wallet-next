'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/features/auth/schemas';
import { loginAction } from '@/server/actions/auth';
import styles from './AuthPage.module.css';

export function LoginForm() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') ?? undefined;
  const passwordReset = searchParams.get('passwordReset') === '1';
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  // Em caso de sucesso a action redireciona e nada volta para cá.
  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await loginAction({ ...values, returnTo });
    if (result && !result.ok) setFormError(result.error);
  });

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {passwordReset && (
        <div className={styles.success}>
          Senha redefinida com sucesso. Faça login.
        </div>
      )}

      {formError && <div className={styles.formError}>{formError}</div>}

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

      <div className={styles.field}>
        <label className={styles.label} htmlFor="password">
          Senha
        </label>
        <input
          id="password"
          type="password"
          className={styles.input}
          autoComplete="current-password"
          {...register('password')}
        />
        {errors.password && (
          <span className={styles.fieldError}>{errors.password.message}</span>
        )}
        <p className={styles.forgotLink}>
          <Link href="/forgot-password">Esqueceu a senha?</Link>
        </p>
      </div>

      <button type="submit" className={styles.submit} disabled={isSubmitting}>
        {isSubmitting ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  );
}
