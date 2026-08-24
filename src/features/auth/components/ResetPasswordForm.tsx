'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { resetPasswordSchema } from '@/features/auth/schemas';
import { resetPasswordAction } from '@/server/actions/auth';
import styles from './AuthPage.module.css';

/** `confirmPassword` é conferência de digitação — não viaja para o servidor. */
const formSchema = resetPasswordSchema
  .extend({ confirmPassword: z.string().min(1, 'Confirme a nova senha') })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

type ResetPasswordForm = z.infer<typeof formSchema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const tokenFromUrl = useSearchParams().get('token') ?? '';
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { token: tokenFromUrl },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await resetPasswordAction({
      token: values.token,
      password: values.password,
    });
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    router.replace('/login?passwordReset=1');
  });

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {formError && <div className={styles.formError}>{formError}</div>}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="token">
          Código de redefinição
        </label>
        <input
          id="token"
          type="text"
          className={styles.input}
          autoComplete="off"
          {...register('token')}
        />
        {errors.token && (
          <span className={styles.fieldError}>{errors.token.message}</span>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="password">
          Nova senha
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

      <div className={styles.field}>
        <label className={styles.label} htmlFor="confirmPassword">
          Confirmar nova senha
        </label>
        <input
          id="confirmPassword"
          type="password"
          className={styles.input}
          autoComplete="new-password"
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <span className={styles.fieldError}>
            {errors.confirmPassword.message}
          </span>
        )}
      </div>

      <button type="submit" className={styles.submit} disabled={isSubmitting}>
        {isSubmitting ? 'Salvando…' : 'Redefinir senha'}
      </button>
    </form>
  );
}
