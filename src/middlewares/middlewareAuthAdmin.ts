import type { Context, Next } from 'hono';
import { DataSource } from 'typeorm';
import { User } from '@/entity/entityUser.ts';
import Globals from '@/utils/globals.ts';

interface UserWithToken {
  id: string;
  role: string;
  token: string;
}

export default async (c: Context, next: Next) => {
  const token = c.req.header('Authorization');

  if (!token) {
    throw new Error('No token provided');
  }

  const userRepository = Globals.dataSource.getRepository<UserWithToken>(User);
  const user = await userRepository.findOne({
    where: { token },
  });

  if (!user || user.role !== 'admin') {
    throw new Error('Unauthorized access');
  }

  await next();
};
