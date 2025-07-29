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

  // check if token provided
  if (!token) {
    return c.json({
      status: false,
      message: 'No token provided',
    });
  } else {
    // else verify the token value
    const userRepository = Globals.dataSource.getRepository<UserWithToken>(User);
    const user = await userRepository.findOne({
      where: { token: token.replace('Bearer ', '') },
    });

    if (!user || user.role !== 'admin')
      return c.json({
        status: false,
        message: 'Invalid token',
      });
    else await next();
  }
};
