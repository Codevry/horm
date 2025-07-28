import type { Context, Next } from 'hono';
import { DataSource } from 'typeorm';
import { User } from '@/entity/entityUser.ts';

interface UserWithToken {
  id: string;
  role: string;
  token: string;
}

export const middlewareAuthAdmin = (db: DataSource) => {
  return async (c: Context, next: Next) => {
    const token = c.req.header('Authorization');

    if (!token) {
      throw new Error('No token provided');
    }

    const userRepository = db.getRepository<UserWithToken>(User);
    const user = await userRepository.findOne({
      where: { token },
    });

    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized access');
    }

    await next();
  };
};
