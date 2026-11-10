import { User } from '@/entity/entityUser.ts';
import { ENUM_ROLES } from '@/utils/enums.ts';
import Globals from '@/utils/globals.ts';

/**
 * find an active admin user by their token, returns null if the token is invalid
 */
export async function findAdminByToken(token: string | undefined | null): Promise<User | null> {
  const value = token?.replace(/^Bearer\s+/i, '').trim();
  if (!value) return null;

  const user = await Globals.dataSource.getRepository(User).findOne({ where: { token: value } });
  if (!user || user.role !== ENUM_ROLES.ADMIN || user.isActive === false) return null;
  return user;
}
