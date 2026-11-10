import { toUser, type User, type UserRow } from '@/entity/entityUser.ts';
import { ENUM_ROLES } from '@/utils/enums.ts';
import Globals from '@/utils/globals.ts';

/**
 * find an active admin user by their token, returns null if the token is invalid
 */
export async function findAdminByToken(token: string | undefined | null): Promise<User | null> {
  const value = token?.replace(/^Bearer\s+/i, '').trim();
  if (!value) return null;

  const row = Globals.db.query<UserRow, [string]>('SELECT * FROM users WHERE token = ?').get(value);
  if (!row) return null;

  const user = toUser(row);
  if (user.role !== ENUM_ROLES.ADMIN || !user.isActive) return null;
  return user;
}
