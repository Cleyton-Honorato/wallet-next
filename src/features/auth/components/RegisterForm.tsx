'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@/features/auth/schemas';
import { registerAction } from '@/server/actions/auth';
import styles from './AuthPage.module.css';

export function RegisterForm() {
  const returnTo = useSearchParams().get('returnTo') ?? undefined;
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await registerAction({ ...values, returnTo });
    if (result && !result.ok) setFormError(result.error);
  });

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {formError && <div className={styles.formError}>{formError}</div>}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="name">
          Nome
        </label>
        <input
          id="name"
          type="text"
          className={styles.input}
          autoComplete="name"
          {...register('name')}
        />
        {errors.name && (
          <span className={styles.fieldError}>{errors.name.message}</span>
        )}
      </div>

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
          autoComplete="new-password"
          {...register('password')}
        />
        {errors.password && (
          <span className={styles.fieldError}>{errors.password.message}</span>
        )}
      </div>

      <button type="submit" className={styles.submit} disabled={isSubmitting}>
        {isSubmitting ? 'Criando…' : 'Criar conta'}
      </button>
    </form>
  );
}
