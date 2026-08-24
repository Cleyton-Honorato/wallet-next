'use server';

import { redirect } from 'next/navigation';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
} from '@/features/auth/schemas';
import { publicAction } from '@/server/actions/_helpers';
import { createSession, destroySession } from '@/server/auth/session';
import {
  signPasswordResetToken,
  verifyPasswordResetToken,
} from '@/server/auth/jwt';
import { hashPassword, verifyPassword } from '@/server/auth/password';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '@/server/errors';
import {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserPassword,
} from '@/server/services/users';
import type { ActionResult } from '@/lib/result';

/** Só aceita caminhos internos — barra `//host` e URLs absolutas. */
function safeReturnTo(value: string | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

export async function loginAction(
  input: LoginInput & { returnTo?: string },
): Promise<ActionResult<void>> {
  const { returnTo, ...credentials } = input;

  const result = await publicAction({
    schema: loginSchema,
    input: credentials,
    handler: async (data) => {
      const user = await findUserByEmail(data.email);
      // Mensagem genérica: não revela se o e-mail existe.
      if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
        throw new BadRequestError('Credenciais inválidas');
      }
      await createSession({
        userId: user.id,
        email: user.email,
        name: user.name,
      });
    },
  });

  if (!result.ok) return result;
  redirect(safeReturnTo(returnTo));
}

export async function registerAction(
  input: RegisterInput & { returnTo?: string },
): Promise<ActionResult<void>> {
  const { returnTo, ...payload } = input;

  const result = await publicAction({
    schema: registerSchema,
    input: payload,
    handler: async (data) => {
      const existing = await findUserByEmail(data.email);
      if (existing) throw new ConflictError('E-mail já cadastrado');

      const user = await createUser({
        name: data.name,
        email: data.email,
        passwordHash: await hashPassword(data.password),
      });

      await createSession({
        userId: user.id,
        email: user.email,
        name: user.name,
      });
    },
  });

  if (!result.ok) return result;
  redirect(safeReturnTo(returnTo));
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect('/login');
}

/**
 * Ainda não há envio de e-mail: o código volta na resposta e é exibido na tela,
 * como no app anterior.
 */
export async function forgotPasswordAction(
  input: ForgotPasswordInput,
): Promise<ActionResult<{ message: string; resetToken?: string }>> {
  return publicAction({
    schema: forgotPasswordSchema,
    input,
    handler: async (data) => {
      const message =
        'Se o e-mail estiver cadastrado, use o código abaixo para redefinir sua senha.';

      const user = await findUserByEmail(data.email);
      if (!user) return { message };

      return { message, resetToken: await signPasswordResetToken(user.id) };
    },
  });
}

export async function resetPasswordAction(
  input: ResetPasswordInput,
): Promise<ActionResult<{ message: string }>> {
  return publicAction({
    schema: resetPasswordSchema,
    input,
    handler: async (data) => {
      const userId = await verifyPasswordResetToken(data.token);
      if (!userId) throw new BadRequestError('Código inválido ou expirado');

      const user = await findUserById(userId);
      if (!user) throw new NotFoundError('Usuário não encontrado');

      await updateUserPassword(user.id, await hashPassword(data.password));
      return { message: 'Senha redefinida com sucesso' };
    },
  });
}
