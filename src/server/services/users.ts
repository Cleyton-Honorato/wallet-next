import 'server-only';
import { db } from '@/server/db';

export function findUserByEmail(email: string) {
  return db.user.findUnique({ where: { email } });
}

export function findUserById(id: number) {
  return db.user.findUnique({ where: { id } });
}

export function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
}) {
  return db.user.create({ data });
}

export function updateUserPassword(id: number, passwordHash: string) {
  return db.user.update({ where: { id }, data: { passwordHash } });
}
